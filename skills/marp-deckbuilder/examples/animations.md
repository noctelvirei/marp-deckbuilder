---
title: Marp Deckbuilder Animation Showcase
customerName: SampleBank
customerLogo: resource:logos/sample-customer.svg
presenter:
  name: Jane Smith
  role: VP Solutions
---

<deck-slide layout="cover" />

# Animation Showcase

PPTX-compatible controlled slide animations.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Fade is the simplest controlled entrance for progressive presentation pacing."
  animation="enter-fade"
  animation-trigger="after-previous"
  animation-duration="1200"
  animation-delay="150"
/>

# enter-fade

- Controlled in HTML and PPTX.
- Leaves component-local chart animations alone.
- Useful for normal content reveals.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Appear is an instant reveal after the configured delay."
  animation="enter-appear"
  animation-trigger="after-previous"
  animation-delay="250"
/>

# enter-appear

- No opacity ramp.
- Matches PowerPoint's Appear effect.
- Useful for clicker-driven builds.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Fly uses PowerPoint's default fly-in from below."
  animation="enter-fly"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-fly

- Moves content in from below.
- Preserves the slide chrome.
- Works best on simple content groups.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Wipe reveals content from the top edge downward."
  animation="enter-wipe"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-wipe

- Uses PowerPoint's wipe filter.
- HTML uses the same directional reveal.
- Good for section-level content.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Zoom grows content from the centre."
  animation="enter-zoom"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-zoom

- Scales content from zero to full size.
- Mirrors PowerPoint's zoom entrance.
- Better for short content than dense slides.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Split opens content from the centre."
  animation="enter-split"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-split

- Opens outward from the middle.
- Uses PowerPoint's vertical split filter.
- Keeps final content fully visible.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Wheel uses a radial sweep reveal."
  animation="enter-wheel"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-wheel

- Reveals content radially.
- Uses PowerPoint's one-spoke wheel.
- Best for light emphasis.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Box opens a rectangular reveal from the centre."
  animation="enter-box"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-box

- Expands a box-shaped reveal.
- Matches PowerPoint's box-in filter.
- Useful on simple text and card surfaces.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Diamond opens from the centre on a diamond mask."
  animation="enter-diamond"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-diamond

- Uses PowerPoint's diamond-in filter.
- HTML uses a matching diamond clip.
- Final content resolves fully visible.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Circle opens content from the centre."
  animation="enter-circle"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-circle

- Uses PowerPoint's circle-in filter.
- Reveals from the centre outward.
- Best for concise content.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Blinds reveals horizontal bands."
  animation="enter-blinds"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-blinds

- Uses PowerPoint's horizontal blinds filter.
- HTML uses a matching striped mask.
- Best as a deliberate presentation effect.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Checkerboard reveals alternating tiles."
  animation="enter-checkerboard"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-checkerboard

- Uses PowerPoint's across checkerboard filter.
- HTML uses a temporary checker mask.
- Resolves back to normal content.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Random bars reveals striped bands."
  animation="enter-random-bars"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-random-bars

- Uses PowerPoint's horizontal random bars filter.
- HTML uses a striped reveal.
- Keep it for lightweight emphasis.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Dissolve uses a softer reveal than fade."
  animation="enter-dissolve"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-dissolve

- Uses PowerPoint's dissolve filter.
- HTML uses a soft dissolve.
- Good for simple text or cards.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Peek enters from below with a wipe."
  animation="enter-peek"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-peek

- Moves up from below.
- Uses PowerPoint's peek behavior.
- Works as a directional entrance.

---

<deck-slide
  eyebrow="ENTRANCE"
  takeaway="Strips reveals content diagonally, then resolves to a normal final state."
  animation="enter-strips"
  animation-trigger="after-previous"
  animation-duration="900"
  animation-delay="150"
/>

# enter-strips

- Uses PowerPoint's down-left strips filter.
- HTML uses a matching diagonal reveal.
- Final content is not clipped.

---

<deck-slide
  eyebrow="CLICK BUILD"
  takeaway="Use on-click plus stagger when each top-level item should reveal on the clicker."
  animation="enter-fade"
  animation-trigger="on-click"
  animation-duration="500"
  animation-sequence="stagger"
/>

# Click to reveal

- Confirm the decision path.
- Map the control evidence.
- Pilot with measured outcomes.

---

<deck-close title="Thank you" name="Jane Smith" role="VP Solutions"></deck-close>
