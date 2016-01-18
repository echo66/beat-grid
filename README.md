# beat-grid.js

BeatGrid offers an API to answer the following questions:

* What is the tempo at b beats? (BeatGrid.tempo_at_beats)
* What is the tempo at s seconds? (BeatGrid.tempo_at_seconds)
* What is the mapping between beats and seconds (and vice-versa)? (BeatGrid.seconds, BeatGrid.beats)

Additionally, it offers audio data extraction (BeatGrid.extract_audio_buffer) between an interval measured in beats.

It's kind of similar to BPMTimeline.