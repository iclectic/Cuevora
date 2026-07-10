# Cuevora Accessibility Test Matrix

## Purpose

Use this matrix before claiming Cuevora is accessibility-ready. The goal is practical WCAG/mobile alignment and assistive-technology evidence, not a formal certification claim.

## Required Assistive-Technology Passes

| Area | Tool / Mode | Workflow | Expected Healthy Signal | Failure Signal |
| --- | --- | --- | --- | --- |
| Script library | TalkBack linear navigation | Open Home, search, filter by tag, open script actions | Every control has a useful name; result count and empty states are understandable | Unlabeled icon, repeated "button", card action unreachable |
| Script library | Switch Access group selection | Select refresh, options, create, play, rehearse, delete | Only actionable controls are highlighted and reachable | Non-actionable visuals highlighted or actions skipped |
| Editor | TalkBack | Create script, edit title/content, add tag, open history, restore revision | Autosave and restore status are announced | Saving/error state is visual-only |
| Player | Hardware keyboard | Play/pause, rewind, forward, reset, speed, font, focus line, exit | No shortcut fires while typing; no keyboard trap | Space/arrows trigger while editing or focus cannot escape |
| Player | TalkBack | Navigate top bar, prompt region, transport controls, accessible panel | Controls announce name, state, and result | Moving prompt/progress creates noisy output |
| Player | Reduced motion | Open countdown, controls, gesture guide, listening state | Non-essential scale/slide/pulse motion is removed | Motion remains despite profile/system preference |
| Player | Large text / low vision | Use Low Vision profile on phone and tablet | Text and controls remain readable without overlap | Buttons clip, prompt text occludes controls |
| Record Mode | TalkBack | Start recording, stop, save video, dismiss preview | Recording, permission, save, and completion states are announced | Permission errors or save state are visual-only |
| Record Mode | Switch Access | Start/stop/save/dismiss with group selection | Primary actions are reachable in a sensible order | Camera overlay traps or hides recovery actions |
| Record Mode | Voice Access | Say visible control labels such as "Start Recording" | Visible label and accessible name match | Voice Access cannot target icon-only actions |
| Rehearsal | Speech unavailable | Start rehearsal on unsupported speech path | Limited-feedback state explains unavailable metrics | User sees no explanation for missing metrics |
| Rehearsal | Caption-first profile | Start rehearsal with transcript events | Transcript/status region is prominent and announced politely | Every interim event interrupts or no updates announced |
| Settings | TalkBack | Change accessibility profile and toggles | Profile options expose selected state | Profiles are read as unrelated buttons |
| Android build | Accessibility Scanner | Scan Home, Editor, Player, Record, Rehearsal, Settings | No critical contrast, touch-target, or label findings | Scanner flags unlabeled controls or small targets |
| Play Console | Pre-launch report | Review accessibility section after upload | No unresolved high-severity accessibility warnings | Store claim is blocked until warning is fixed or documented |

## Manual Notes Template

For each pass, record:

- Date:
- Device / OS:
- Build:
- Profile:
- Assistive technology:
- Workflow result:
- Issues found:
- Fix or follow-up:

## Claim Rules

- Claim "accessibility profiles" only for tested profile behavior.
- Claim "keyboard and switch-friendly controls" only after Player and Record Mode pass keyboard and Switch Access checks.
- Claim "screen-reader support" only after TalkBack passes the create-edit-prompt-record-rehearse workflow.
- Do not claim WCAG certification, legal compliance, medical accessibility, or disability treatment.
