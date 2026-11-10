# Finding and refreshing cards efficiently

[Guide index](README.md) · [Main automation](main-automation.md) · [Shared activity cards](shared-activity-card.md)

Source reviewed **2026-11-09**, `v1.0.1-dev`: [chat-message-index.js](../../scripts/chat-message-index.js) and [chat-refresh.js](../../scripts/chat-refresh.js). JavaScript excerpts match the source, with spacing expanded where helpful. Diagrams describe the implementation conceptually.

## Two jobs that cooperate

The index answers **which stored messages match a relationship**. The refresh queue answers **which cards should redraw after a change**. Neither spends a Reaction, evaluates a roll, or applies HP by itself.

```text
Message create/update/delete
  -> maintain shared lookup index
       |-- exact key lookup: find related result(s)
       `-- recent window: supply candidates to refresh selection

Feature document change -> request(featureKey, changedDocument, changes)
Known result/Undo change -> card(card)
  -> coalesce requests -> select/deduplicate cards
  -> render at most eight per batch -> yield between batches
```

Before this shared approach, independent features could each enumerate chat history and redraw overlapping cards. The implementation reduces repeated collection enumeration and combines overlapping rendering requests. That is a description of the design and tested work counts, not a claim of newly measured Foundry performance.

## 1. The index is a collection of relationship buckets

`chat-message-index.js` keeps local in-memory `state`. Its `selectors` read six relationships:

| Index name | Key obtained from a card | Representative use |
| --- | --- | --- |
| `type` | `card.type` | Find check cards during Tandem Footwork startup. |
| `origin` | Origin message ID; normalize a `ChatMessage.` prefix or read the origin document's ID | Find messages sharing a source. |
| `damageAttackId` | Module flag identifying a particular attack | Resolve explicitly linked attack damage. |
| `movementDamage` | The movement-damage flag's `key` | Find an existing movement result. |
| `sharedCardKeys` | Array of recorded grouping keys | Reuse a Region group's card. One card can occupy multiple buckets here. |
| `relentlessRageHealing` | Feature's recorded healing reference flag | Find the matching Relentless Rage healing card. |

Private `put` accepts a card with an ID, reads the selectors, keeps unique nonempty string keys, and inserts its node into the appropriate bucket Maps. Arrays allow multiple keys for one selector. Non-string/empty values are not indexed by these selectors.

The state also has a message-ID-to-node Map and a doubly linked list. Each node records an insertion-order number plus `previous` and `next` references. The list lets the recent-window lookup walk backward from the end without first copying all messages into an array.

These nodes contain IDs and index keys. Lookup functions retrieve the current card from `game.messages.get(id)` before returning it, rather than returning a serialized snapshot of its old flags/resources.

### Initial discovery and rebuilds

The first query calls private `ensure`, which builds state by enumerating the current message collection. Subsequent queries reuse it while the collection object is the same and its reported size agrees with the node count. Replacing the collection or a detectable size mismatch rebuilds it.

This is lazy initialization: loading the module does not immediately scan the entire history. It also means the first relevant query can still do a full enumeration. “Indexed” does not mean zero work or guaranteed constant-time queries.

### Incremental maintenance

The `ready` listeners call `updateMessageIndex` for message creation/update and `deleteMessageIndex` for deletion. When state already belongs to the current collection:

- Updating an existing node removes its old bucket memberships and re-adds keys from the current card. It preserves that node's position/order.
- Creating a new node appends it to the list and assigns the next order number.
- Deleting removes bucket memberships, reconnects neighboring list nodes, and removes the node itself.

Empty buckets are discarded. Updates re-evaluate these selectors even if only unrelated flags changed; they do not enumerate the whole message collection to do it.

The size/collection checks are recovery heuristics, not substitutes for hooks. A same-size replacement of individual cards within the same collection without the expected events is not fully detected by those checks. Actor changes and rendering do not independently invalidate this link index.

## 2. Choose the right query

| Export | Return/order | Important limit |
| --- | --- | --- |
| `indexedMessages(name,key)` | All existing cards in the matching bucket, sorted by stored insertion order, oldest first | It sorts that bucket; it does not return every card in chat. Unknown/missing buckets return `[]`. |
| `latestIndexedMessage(name,key,predicate)` | Matching card with greatest stored order that also passes the predicate | Returns `null` when none qualify; iterates the bucket rather than scanning all chat. Predicate defaults to accepting any card. |
| `recentIndexedMessages(limit=100)` | Newest available window, returned oldest-to-newest within that window | Walks backward through the linked list, then reverses the result. This is a message-count window, not a time window. |
| `updateMessageIndex(card)` | Incrementally add/re-key a card when the current state is initialized | Does not force initial history discovery by itself. |
| `deleteMessageIndex(card)` | Remove an existing node from initialized state | Does not delete the actual ChatMessage. |

“Latest” means order assigned from the initial collection iteration and subsequent new-node insertions. It is not the latest edited card or a sort by timestamp. Editing an older card's shared keys does not promote it above newer cards. Deleting and recreating an ID gives the new node a fresh order.

For example, the predicate-aware selection contains:

```js
for(const node of state.buckets[name]?.get(key)?.values()??[]){
  if(latest&&node.order<=latest.order)continue;
  const card=game.messages.get(node.id);
  if(card&&predicate(card)){latest=node;result=card;}
}
```

`?.` tolerates a missing bucket. `?? []` supplies an empty iterable. `continue` skips the current iteration. `predicate` is a callback deciding whether a found card qualifies; it does not automatically impose permissions. The movement workflow supplies `message => message.isOwner` in its own call.

Representative callers are [movement-damage.js](../../scripts/movement-damage.js), [the main Region engine](../../scripts/ugmuls-5-5e-automation.js), [elemental-rebuke.js](../../scripts/elemental-rebuke.js), [relentless-rage.js](../../scripts/relentless-rage.js), and [tandem-footwork.js](../../scripts/tandem-footwork.js).

### Two indexes with different maintenance strategies

Do not confuse this index with the private HP-card index in [shared-activity-card.js](../../scripts/shared-activity-card.js). That index groups damage/healing cards by origin and invalidates for its relevant document changes. This index incrementally maintains several relationships for all message types. They currently coexist; neither stores permanent answers about HP/Undo locks.

## 3. Refreshing: ask broadly enough, then narrow the work

`chat-refresh.js` exposes `requestFeatureRefresh`, `requestCardRefresh`, and `flushChatRefresh`. At `ready`, its global API maps `request` to `requestFeatureRefresh` and `card` to `requestCardRefresh`. Feature files register their own relevant Actor/Item/effect/combat hooks; this scheduler does not independently subscribe to every possible resource update.

### Feature requests

`requestFeatureRefresh(key,doc,changes)` looks up a rule in the local `rules` object. Unknown keys or disabled settings return immediately. Callers should pass the changed document, rather than omitting it as the routine default.

Actor resolution accepts an Actor directly or an owning/associated actor. Combat-like documents can supply combatants. Deliberately omitting the document broadens discovery to world actors and active-scene token actors. Relevant actors are filtered by local ownership/GM status and the rule's feature, features/grant, or effect conditions.

The changed Item/effect is included in relevance checks. That matters on removal: it can identify a feature/grant that just disappeared from the actor's collection, allowing obsolete controls to be redrawn away. It is not a universal cleanup guarantee for every removal; callers must forward the relevant document and the rule must represent its dependency.

Token position, visibility, or membership-only changes are ignored here. A Token request proceeds only when the supplied changes include `delta`, `actorData`, or `actorId`. That preserves synthetic-actor updates without making ordinary token movement rebuild historical reaction cards.

### Direct requests

When the affected result is already known, `requestCardRefresh` uses its ID:

```js
export function requestCardRefresh(card){
  if(card?.id){direct.set(card.id,card);schedule();}
}
```

A `Map` stores one value per key, so repeated requests for the same ID overwrite the entry rather than append duplicates. This path does not search history or apply the feature rule's type/actor/mounted-card selection. Callers and renderers remain responsible for correct scope and permissions.

Fount's used button, result corrections, and Undo are examples where a known-card request is useful. A direct refresh can reach a card outside the recent/mounted feature window.

## 4. Read a refresh rule as a selection contract

| Rule field | Meaning in this scheduler |
| --- | --- |
| `setting` | World option must be strictly `true` before a feature request is accepted. |
| `types` | Only these message types are candidates. |
| `feature` | Actor needs a matching Item identifier or normalized name; the changed Item can provide removed-feature evidence. |
| `features`, optional `grant` | Multiple allowed source features, or the relevant actor grant flag. |
| `effect` | Match an actor/changed effect name against the regular expression. |
| `own` | Match the card's associated actor to the affected actor. This is a source-actor relationship, not merely a permission label. |
| `incoming` | Match a recorded target's Actor UUID or resolve its Token UUID back to the affected actor. |
| `candidates` | Look for the actor in the named snapshot flag's `entries`. Refreshes recorded candidates without creating new entries. |
| `all` | Accept any card of the configured type after the actor relevance gate. It does not mean every message, all clients, or a bypass of the rule's setting. |

Relationship alternatives are OR conditions, still constrained by message type. A rule can match the source actor, an incoming defender, or saved candidate entries as configured.

For example, Shield selects incoming attack cards for relevant Shield actors; Bardic Inspiration selects its actor's attack/save/check cards with an Inspired effect; snapshot-based rules can select only the actor's recorded opportunities. The renderer then evaluates what controls actually belong on the card. Scheduling selection is not the complete feature eligibility test.

## 5. Coalesce, select, render, and yield

The scheduler holds two Maps: `pending` uses feature-key-plus-Actor-UUID keys, while `direct` uses card IDs. It has a `timer` and `running` guard.

The current scheduling function is:

```js
function schedule(){
  if(timer===null&&!running)timer=setTimeout(()=>{
    timer=null;
    flushChatRefresh().catch(error=>console.error("Chat refresh",error));
  },32);
}
```

`setTimeout` schedules a later callback; 32 ms is the requested coalescing delay, not a guaranteed render deadline. While work is running, new requests remain in the Maps for the active flush to pick up.

`flushChatRefresh` returns immediately if another flush is running. Otherwise it clears the pending timer and processes passes until both Maps are empty:

1. Copy pending feature requests and direct cards; clear those live Maps for new arrivals.
2. For feature requests, gather mounted message IDs from the DOM when that API is available. Both standalone cards and grouped summaries can supply `data-message-id`.
3. Walk the latest 100 indexed messages once for this pass. Skip unmounted cards when a mounted-ID set exists; apply the rule's type/actor/snapshot conditions.
4. Merge selected cards into the same card-ID Map as direct requests. Several features can therefore select one card without duplicating it in this pass.
5. Render groups of at most eight. Re-resolve each ID immediately before rendering, skipping messages deleted since they were queued.
6. Yield through a zero-delay timer between groups when more cards remain. Process another pass if requests arrived during the work.

The batch boundary is visible in this excerpt:

```js
await Promise.allSettled(list.slice(index,index+8).map(card=>Promise.resolve().then(()=>{
  const current=game.messages?.get?.(card.id);
  if(current)return ui.chat?.updateMessage?.(current);
})));
if(index+8<list.length)await new Promise(resolve=>setTimeout(resolve,0));
```

`slice` selects the next group. `map` creates the Promises. Wrapping each call in `.then` also turns a synchronous render exception into a rejection. `Promise.allSettled` waits for all outcomes without letting one failed card prevent the others from completing. This branch does not report each individual rejected render or automatically retry it.

The `finally` resets `running` and schedules remaining work if needed. Deduplication is per collected pass: a fresh request arriving during rendering can legitimately cause another pass and another render. It is not a promise of one render forever or exactly one history-window traversal across all concurrent arrivals.

## 6. What belongs outside this queue

Render callbacks can run repeatedly. They should reconstruct their controls without writing resource/effect/card flags or enqueuing themselves on every render. Otherwise rendering can create more work indefinitely despite batching.

The queue does not reserve a Reaction, validate an incoming socket action, enforce adjustment locks, or roll/refund resources. Those checks stay in authoritative workflows at use time. Delaying presentation must not delay turn-rule expiry or permit double spending.

Similarly, a snapshot-based reaction keeps its captured facts. Redrawing a Fount card reads that snapshot; it does not recalculate distance or revive a used opportunity. [Fount's walkthrough](fount-of-moonlight.md) and the [pending guide](pending-cast-and-damage.md) explain where those state writes actually happen.

`all`/direct selection and the index's generic queries do not enforce chat whisper/blind visibility. Correct card rendering and feature-side permission checks remain necessary. This local UI scheduler is not an authority or disclosure boundary.

## 7. Connections and change discipline

| Change being made | Connection to revisit |
| --- | --- |
| Add another reusable message relationship | Add a selector only when justified; cover key changes/removal, creation/deletion, order, and collection replacement. |
| Add resource/effect/turn-driven controls | Add an appropriately targeted rule and document hooks; forward the changed document. |
| Remove a feature or grant | Ensure its removal event still identifies the affected actor and old controls. |
| Complete a specific correction or Undo | Request known-card refreshes, including relevant linked/source cards as that workflow needs. |
| Alter snapshots | Keep capture/consumption in authoritative event/use paths; do not populate flags in the renderer. |
| Change batching or failure handling | Check work counts, new requests during a flush, deleted-card handling, and whether errors remain diagnosable. |

Possible follow-up verification improvements are recorded in [IMP-006](../improvement-notes/IMP-006-refresh-contract-coverage.md). No queue/index implementation changed during this guide work.

## 8. Verification and in-game observations to plan

The local `chat-message-index.test.mjs` fixture exercises exact key queries, predicates, normalized origins, key/type changes, deletion/recreation, stable insertion order, collection replacement, and large-history work counts. Its 20,000-message synthetic workload compares repeated full enumeration with index seeding and repeated lookups. It does not measure Foundry rendering time or server performance.

The reviewed `chat-refresh.test.mjs` covers unrelated-actor early exits, overlapping requests, own/defender/snapshot selection, removal cleanup, combat recipients, direct deduplication, mounted/grouped filtering, movement exclusion, and failed/deleted-card isolation. `shared-target-sync.test.mjs` connects the real index/refresh path to recorded target changes. Existing fixtures do not establish every scheduling/permission/error-reporting edge case; see IMP-006 before claiming full coverage.

On **2026-11-09**, this targeted run passed: **4 files, 0 failed**.

```text
node tools/run-tests.mjs --filter chat-message-index --filter chat-refresh --filter shared-target-sync --filter roll-adjustment-lock
```

Documentation checks verified local Markdown links, all four JavaScript excerpts against the current source ignoring whitespace, and inclusion of all eight exported function names/signatures across the two files. This documentation-only pass did not rerun the full runtime suite or perform new in-game verification. Local tests/tools remain Git-ignored.

For a later shared change, use these planned scenarios:

| Scenario | What to observe | Status this pass |
| --- | --- | --- |
| Bardic Inspiration or Shield resource/effect changes with several visible cards | Correct owner/defender cards update; unrelated actors' controls remain appropriate; no duplicate buttons. | Not run |
| Remove a supported source feature/effect | Obsolete buttons disappear on affected visible cards. | Not run |
| Move tokens and change visibility without actor-resource changes | Historical snapshot opportunities are not repopulated by movement; live gameplay rules still work in their own workflows. | Not run |
| Shared Region recipients arrive while damage is pending, then apply/Undo | Recorded lists and relevant source/linked controls stay current without rerolling or changing sessions. | Not run |
| Older/unmounted card is revisited and a known card gets an explicit refresh | Renderers compute current presentation; direct correction/Undo refresh is not limited to the recent feature window. | Not run |
| GM/player sessions with private cards and overlapping effects | Existing visibility/ownership checks hold; a broad selection request is not treated as authority to act. | Not run |

If measuring a performance change, use the same large-battle scenario before/after, short normalized captures, and separate sampled inclusive time from exclusive work. A browser trace alone does not establish server timing. No new in-game checks or performance gains are claimed here.

Next, read [Reactions and automation timing](reactions-and-automation-timing.md)—when a resource is reserved and when automatic damage/effects should wait.
