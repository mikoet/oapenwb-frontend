// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only

export interface Dictionary<T>
{
	[key: string]: T;
}

export interface NumbericalDictionary<T>
{
	[key: number]: T;
}

class MapContent<T>
{
	index: number;
	content: T;
}

export class KeyMap<T>
{
	private _keys: Dictionary<MapContent<T>> = {};
	private _values: T[] = [];

	add(key: string, value: T) : KeyMap<T> {
		this._keys[key] = { index: this.values.length, content: value };
		this._values.push(value);
		return this;
	}

	remove(key: string): KeyMap<T> {
		if (this.containsKey(key)) {
			let element = this._keys[key];
			delete this._keys[key];
			this._values.splice(element.index, 1);
		}
		// delete myObject['regex'];
		//this._keys.
		// myArray.splice(index, 1);
		return this;
	}

	containsKey(key: string) : boolean {
		return this._keys.hasOwnProperty(key);
	}

	get(key: string) : T {
		if (this.containsKey(key)) {
			return this._keys[key].content;
		}
		return null;
	}

	size() : number {
		return this._values.length;
	}

	get keys(): string[] {
		return Object.keys(this._keys);
	}

	get values(): T[] {
		return this._values.slice();
	}
}

export class NumericKeyMap<T>
{
	private _keys: NumbericalDictionary<T> = {};
	private _values: T[] = [];

	add(key: number, value: T) : void {
		this._values.push(value);
		this._keys[key] = value;
	}

	containsKey(key: number) : boolean {
		return this._keys.hasOwnProperty(key);
	}

	get(key: number) : T {
		if (this.containsKey(key)) {
			return this._keys[key];
		}
		return null;
	}

	size() : number {
		return this._values.length;
	}

	// TODO for now return string[] instead of number[]
	get keys(): string[] {
		return Object.keys(this._keys);
	}

	get values(): T[] {
		return this._values.slice();
	}
}