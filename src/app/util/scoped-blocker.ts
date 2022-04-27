// SPDX-FileCopyrightText: © 2022 Michael Köther <mkoether38@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-only
import { NgBlockUI } from "ng-block-ui";
import { KeyMap } from "./hashmap";

/**
 * The ScopedBlocker is a utility class for NgBlockUI. It manages a map into which
 * blocking scopes can be put. If there is at least one blocking scope contained
 * in the map NgBlockUI will be told to block the UI. The blocking will only be stopped
 * once all scopes are removed from the map.
 */
export class ScopedBlocker
{
	private blocking: boolean = false;
	private _blockUI: NgBlockUI;
	private blockingScopes: KeyMap<void> = new KeyMap();

	public set blockUI(blockUI: NgBlockUI)
	{
		this._blockUI = blockUI;
	}

	private noScopeIsBlocking() : boolean
	{
		return this.blockingScopes.size() === 0;
	}

	public start(scope: string) : void
	{
		this.blockingScopes.add(scope);
		if (!this.blocking) {
			this._blockUI.start();
			this.blocking = true;
		}
	}

	public stop(scope: string) : void
	{
		this.blockingScopes.remove(scope);
		if (this.noScopeIsBlocking()) {
			this._blockUI.stop();
			this.blocking = false;
		}
	}
}