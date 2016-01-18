'use strict'

class BeatGrid {
	
	constructor(audioBuffer, beatsTimes) {
		// if (audioBuffer === undefined)  {
		// 	throw new Error("Required parameter: audioBuffer");
		// }
		this._audioBuffer = audioBuffer;
		this._beatsArray = [];
		const that = this;
		beatsTimes.forEach((time) => that.add_beat(time));
	}

	/* beat: Number */
	add_beat(beatTime) {
		const L = this._beatsArray.length;
		this._beatsArray.length += 1;
		this._beatsArray[L] = { time: beatTime };
		this._beatsArray.sort((a, b) => a.time - b.time); 
	}

	remove_beat(beatIndex) {
		return this._beatsArray.splice(beatIndex, 1);
	}

	edit(beatIndex, newBeatTime) {
		const previous = this._beatsArray[beatIndex-1];
		const target = this._beatsArray[beatIndex];
		const next = this._beatsArray[beatIndex+1];

		if (previous !== undefined && next !== undefined) {
			if (previous.time > newBeatTime && next.time < newBeatTime) {
				target.time = newBeatTime; 
				return;
			}
		} else if (previous === undefined) {
			if (next.time > newBeatTime) {
				target.time = newBeatTime;
				return;
			}
		} else if (next === undefined) {
			if (previous.time < newBeatTime) {
				target.time = newBeatTime;
				return;
			}
		} 

		throw new Error("Invalid beat time.");
	}
	
	beats(seconds) {
		if (isNaN(seconds) || seconds===undefined || seconds===null) 
			throw new Error("Invalid parameter: seconds");

		if (this._beatsArray.length <= 1) {
			throw new Error("You can't estimate time in beats with none or just one beat. You need two or more beat markers.");
		}

		if (seconds < this._beatsArray[0].time) {
			const previous = this._beatsArray[0];
			const next = this._beatsArray[1];
			const coef = (seconds - previous.time) / (next.time - previous.time);
			return coef;
		}

		if (seconds > this._beatsArray[this._beatsArray.length-1].time) {
			const previous = this._beatsArray[this._beatsArray.length-2];
			const next = this._beatsArray[this._beatsArray.length-1];
			const coef = (seconds - next.time) / (next.time - previous.time);
			return (this._beatsArray.length - 1) + coef;
		}

		var idx = find_index(this._beatsArray, {time: seconds}, (a,b) => a.time - b.time);

		if (idx.length === 1) {
			return this._beatsArray[idx[0]].time;
		} else {
			const pIdx = idx[0];
			const nIdx = idx[1];
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];
			const duration = next.time - previous.time;
			const coef = (seconds - previous.time) / duration;
			return previous.time + coef * duration;
		}
	}

	seconds(beat) {
		if (isNaN(beat) || beat===undefined || beat===null) 
			throw new Error("Invalid parameter: beat");

		if (this._beatsArray.length <= 1) {
			throw new Error("You can't estimate time in seconds with none or just one beat. You need two or more beat markers.");
		}

		if (beat >= this._beatsArray.length) {
			const pIdx = this._beatsArray.length - 2;
			const nIdx = this._beatsArray.length - 1;
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];
			const duration = (next.time - previous.time);
			const coef = (beat - pIdx);

			return next.time + coef * duration;
		}

		if (beat < 0) {
			const pIdx = 0;
			const nIdx = 1;
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];
			const duration = (next.time - previous.time);
			const coef = (beat - pIdx);

			return previous.time + coef * duration;
		}
		
		const pIdx = Math.floor(beat);
		const nIdx = Math.ceil(beat);

		if (pIdx === nIdx) 
			return this._beatsArray[beat].time;
		else {
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];

			if (previous && next) {
				const duration = next.time - previous.time;
				const coef = beat - pIdx;
				return previous.time + coef * duration;
			} else if (previous) {
				const pprevious = this._beatsArray[pIdx-1];
				return previous.time + (previous.time - pprevious.time) * (beat - pIdx);
			} else {
				const nnext = this._beatsArray[nIdx+1];
				return next.time - (nnext.time - next.time) * (nIdx - beat);
			}
		}
	}

	bpm_at_beat(beat) {

		if (this._beatsArray.length <= 1) {
			throw new Error("You need at least two beats to estimate the tempo.");
		}

		if (beat >= this._beatsArray.length) {
			const pIdx = this._beatsArray.length - 2;
			const nIdx = this._beatsArray.length - 1;
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];
			return 60 / (next.time - previous.time);
		}

		if (beat < 0) {
			const pIdx = 0;
			const nIdx = 1;
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];
			return 60 / (next.time - previous.time);
		}

		const pIdx = Math.floor(beat);
		const nIdx = Math.ceil(beat);
		if (pIdx === nIdx) {
			return 60 / (this._beatsArray[pIdx+1].time -previous.time);
		} else {
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];
			return 60 / (next.time - previous.time);
		}

	}

	bpm_at_seconds(seconds) {

		if (this._beatsArray.length <= 1) {
			throw new Error("You need at least two beats to estimate the tempo.");
		}

		if (seconds <= this._beatsArray[0].time) {
			const pIdx = 0;
			const nIdx = 1;
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];
			return 60 / (next.time - previous.time);
		}

		if (seconds >= this._beatsArray[this._beatsArray.length-1]) {
			const pIdx = this._beatsArray.length-2;
			const nIdx = pIdx + 1;
			const previous = this._beatsArray[pIdx];
			const next = this._beatsArray[nIdx];
			return 60 / (next.time - previous.time);
		}

		var idx = find_index(this._beatsArray, {time: seconds}, (a,b) => a.time - b.time);
		if (idx.length == 1) {
			const pIdx = idx[0];
			const nIdx = pIdx + 1;
		} else {
			const pIdx = idx[0];
			const nIdx = idx[1];
		}
		const previous = this._beatsArray[pIdx];
		const next = this._beatsArray[nIdx];
		return 60 / (next.time - previous.time);
	}


	extract_audio_buffer(audioCtx, startBeat, endBeat) {
		const t0 = Math.round(this.seconds(startBeat) * this._audioBuffer.sampleRate);
		const t1 = Math.round(this.seconds(endBeat) * this._audioBuffer.sampleRate);
		const length = t1-t0;
		const nbrChannels = this._audioBuffer.numberOfChannels;
		const sampleRate  = this._audioBuffer.sampleRate;

		const newAudioBuffer = audioCtx.createBuffer(nbrChannels, length, sampleRate);

		for (let channel=0; channel<nbrChannels; channel++) {
			const source = this._audioBuffer.getChannelData(channel).subarray(t0, t1);
			newAudioBuffer.copyToChannel(source, channel, 0);
		}

		return newAudioBuffer;
	}



	find_index(values, target, compareFn) {
		if (values.length == 0 || compareFn(target, values[0]) < 0) { 
			return [undefined, 0]; 
		}
		if (compareFn(target, values[values.length-1]) > 0 ) {
			return [values.length-1, undefined];
		}
		return modified_binary_search(values, 0, values.length - 1, target, compareFn);
	}

	modified_binary_search(values, start, end, target, compareFn) {
		// if the target is bigger than the last of the provided values.
		if (start > end) { return [end]; } 

		var middle = Math.floor((start + end) / 2);
		var middleValue = values[middle];

		if (compareFn(middleValue, target) < 0 && values[middle+1] && compareFn(values[middle+1], target) > 0)
			// if the target is in between the two halfs.
			return [middle, middle+1];
		else if (compareFn(middleValue, target) > 0)
			return modified_binary_search(values, start, middle-1, target, compareFn); 
		else if (compareFn(middleValue, target) < 0)
			return modified_binary_search(values, middle+1, end, target, compareFn); 
		else 
			return [middle]; //found!
	}

}