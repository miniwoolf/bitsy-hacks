/**
📎
@file noclip
@summary walk through wall tiles, sprites, items, exits, and endings
@license MIT
@author Sean S. LeBlanc

@description
Adds a "noclip" command, which allows player to walk through wall tiles, sprites, items, exits, and endings.
Also adds a room cycle command for use with noclip.

HOW TO USE:
1. Copy-paste this script into a script tag after the bitsy source
2. Press 'space' to toggle noclip
3. Press 'r' while noclip is enabled to cycle rooms
*/
import bitsy from 'bitsy';
import { hackOptions as customKeyhandlers } from './custom-keyhandlers';

var noClip = false;

// save references to existing functions
var originalGetSpriteAt = bitsy.getSpriteAt;
var originalIsWallLeft = bitsy.isWallLeft;
var originalIsWallRight = bitsy.isWallRight;
var originalIsWallUp = bitsy.isWallUp;
var originalIsWallDown = bitsy.isWallDown;
var originalGetExit = bitsy.getExit;
var originalGetEnding = bitsy.getEnding;
var originalGetItemIndex = bitsy.getItemIndex;

var toggleNoClip = function () {
	noClip = !noClip;
	if (noClip) {
		// disable functions
		bitsy.getSpriteAt =
			bitsy.isWallLeft =
			bitsy.isWallRight =
			bitsy.isWallUp =
			bitsy.isWallDown =
			bitsy.getExit =
			bitsy.getEnding =
				function () {
					return null;
				};
		bitsy.getItemIndex = function () {
			return -1;
		};
		console.log('noclip enabled');
	} else {
		// re-enable functions
		bitsy.getSpriteAt = originalGetSpriteAt;
		bitsy.isWallLeft = originalIsWallLeft;
		bitsy.isWallRight = originalIsWallRight;
		bitsy.isWallUp = originalIsWallUp;
		bitsy.isWallDown = originalIsWallDown;
		bitsy.getExit = originalGetExit;
		bitsy.getEnding = originalGetEnding;
		bitsy.getItemIndex = originalGetItemIndex;
		console.log('noclip disabled');
	}
};

customKeyhandlers.ondown = {
	r: function () {
		var k = Object.keys(bitsy.room);
		bitsy.curRoom = bitsy.player().room = k[(k.indexOf(bitsy.player().room) + 1) % k.length];
	},
	' ': toggleNoClip,
};
