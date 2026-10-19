# One-time delayed acid damage

Both recipes use the book Lingering Acid effect and native delayed-damage activity. Initial effect application continues to follow existing manual/automatic effect settings. With a linked cast card, Acid Arrow requires a confirmed hit; Vitriolic Sphere requires a failed save for that target. Applying effects manually from a sheet without a cast link remains an explicit GM decision.

- Melf's Acid Arrow: Lingering Acid Damage, 2d4 Acid at base level, plus 1d4 per slot level above 2. The delayed damage is not critical damage.
- Vitriolic Sphere: End of Turn Damage, fixed 5d4 Acid; only its initial damage scales.

At the affected creature's turn end, create one damage-only card using the original cast level and inherited persistent damage choices. Existing damage prompt ownership/GM fallback and Pending takeover continue to apply. Native one-turn/start-turn expiry is replaced on the applied effect by module-controlled lifetime so it survives until its damage occurs. Book effects are never edited.

Persist the created card reference on the tracked effect. Later turns do not create additional cards, even if the damage dialog was canceled. Complete the existing card using its damage/Pending controls. After a real completed damage roll and viewer animations, remove only the tracked effect. The damage card remains available for manual application/Undo; consuming the trigger does not depend on automatic HP application being enabled. No save follows the delayed damage. Refreshed effect instances reject old result cards.

Validate with fresh casts: hit/miss Acid Arrow, mixed saved/failed Sphere targets, slot scaling, initial effect application, next target turn-end timing, canceled Pending recovery, repeated turn updates, connected owner/GM fallback, disabled/deleted effects, and dice animation timing. A successful Sphere save or missed Arrow must not receive a Lingering Acid trigger. Acid Arrow's initial damage now prompts on either hit or miss. Initial damage remains visible on misses (including after Shield), and native manual/automatic damage trays default to half on a miss or full on a hit, retaining native resistance/immunity/vulnerability calculations. Explicit GM multiplier changes override that default. Misses never acquire Lingering Acid; delayed damage is not halved by this rule.
