/*
 * ext-eyedropper.js
 *
 * Licensed under the Apache License, Version 2
 *
 * Copyright(c) 2010 Jeff Schiller
 *
 */

// Dependencies:
// 1) jQuery
// 2) history.js
// 3) svg_editor.js
// 4) svgcanvas.js

svgEditor.addExtension("eyedropper", function(S) {
		var svgcontent = S.svgcontent,
			svgns = "http://www.w3.org/2000/svg",
			svgdoc = S.svgroot.parentNode.ownerDocument,
			svgCanvas = svgEditor.canvas,
			ChangeElementCommand = svgedit.history.ChangeElementCommand,
			addToHistory = function(cmd) { svgCanvas.undoMgr.addCommandToHistory(cmd); },
			currentStyle = {fillPaint: "red", fillOpacity: 1.0,
							strokePaint: "black", strokeOpacity: 1.0, 
							strokeWidth: 5, strokeDashArray: null,
							opacity: 1.0,
							strokeLinecap: 'butt',
							strokeLinejoin: 'miter',
							};
		function getStyle(opts) {
			// if we are in eyedropper mode, we don't want to disable the eye-dropper tool
			var mode = svgCanvas.getMode();
			if (mode == "eyedropper") return;

			var elem = null;
			var tool = $('#tool_eyedropper');
			
			if (opts.elems[0] &&
				$.inArray(opts.elems[0].nodeName, ['svg', 'g', 'use']) == -1) 
			{
				elem = opts.elems[0];
				tool.removeClass('disabled');
			}
			// disable eye-dropper tool
			else {
				tool.addClass('disabled');
			}

		}
		
		var getPaint = function(color, opac, type) {
			// update the editor's fill paint
			var opts = null;
			console.log(color);
			if (color.indexOf("url(#") === 0) {
				var refElem = svgCanvas.getRefElem(color);
				if(refElem) {
					refElem = refElem.cloneNode(true);
				} else {
					refElem =  $("#" + type + "_color defs *")[0];
				}

				opts = { alpha: opac };
				opts[refElem.tagName] = refElem;
			} 
			else if (color.indexOf("#") === 0) {
				opts = {
					alpha: opac,
					solidColor: color.substr(1)
				};
			}
			else {
				opts = {
					alpha: opac,
					solidColor: 'none'
				};
			}
			return new $.jGraduate.Paint(opts);
		};
		
		return {
			name: "eyedropper",
			svgicons: "extensions/eyedropper-icon.xml",
			buttons: [{
				id: "tool_eyedropper",
				type: "mode",
				title: "Eye Dropper Tool",
				key: "I",
				class: "disabled",
				events: {
					"click": function() {
						svgCanvas.setMode("eyedropper");
					}
				}
			}],
			
			
			// if we have selected an element, grab its paint and enable the eye dropper button
			selectedChanged: getStyle,
			elementChanged: getStyle,
			mouseDown: function(opts) {
				var mode = svgCanvas.getMode();
				var e = opts.event;
				var target = (e.target.id === "svgroot") ? document.getElementById('canvas_background') : e.target;
				if (mode == "eyedropper" && target) {
					currentStyle.fillPaint = target.getAttribute("fill") || "white";
  				currentStyle.fillOpacity = target.getAttribute("fill-opacity") || 1.0;
  				currentStyle.strokePaint = target.getAttribute("stroke") || 'none';
  				currentStyle.strokeOpacity = target.getAttribute("stroke-opacity") || 1.0;
  				currentStyle.strokeWidth = target.getAttribute("stroke-width");
  				currentStyle.strokeDashArray = target.getAttribute("stroke-dasharray");
  				currentStyle.strokeLinecap = target.getAttribute("stroke-linecap");
  				currentStyle.strokeLinejoin = target.getAttribute("stroke-linejoin");
  				currentStyle.opacity = target.getAttribute("opacity") || 1.0;
					if ($.inArray(opts.selectedElements.nodeName, ['g', 'use']) == -1) {
						var changes = {};
						var change = function(elem, attrname, newvalue) {
							changes[attrname] = elem.getAttribute(attrname);
							elem.setAttribute(attrname, newvalue);
						};
						var batchCmd = new S.BatchCommand();
						opts.selectedElements.forEach(function(element){
						  if (currentStyle.fillPaint) 		  change(element, "fill", currentStyle.fillPaint);
  						if (currentStyle.fillOpacity) 		change(element, "fill-opacity", currentStyle.fillOpacity);
  						if (currentStyle.strokePaint) 		change(element, "stroke", currentStyle.strokePaint);
  						if (currentStyle.strokeOpacity) 	change(element, "stroke-opacity", currentStyle.strokeOpacity);
  						if (currentStyle.strokeWidth) 		change(element, "stroke-width", currentStyle.strokeWidth);
  						if (currentStyle.strokeDashArray) change(element, "stroke-dasharray", currentStyle.strokeDashArray);
  						if (currentStyle.opacity) 			  change(element, "opacity", currentStyle.opacity);
  						if (currentStyle.strokeLinecap) 	change(element, "stroke-linecap", currentStyle.strokeLinecap);
  						if (currentStyle.strokeLinejoin) 	change(element, "stroke-linejoin", currentStyle.strokeLinejoin);
  						batchCmd.addSubCommand(new ChangeElementCommand(element, changes));
  						console.log(changes);
  						changes = {};
						});
						var fill = getPaint(currentStyle.fillPaint, currentStyle.fillOpacity*100, "fill")
						var stroke = getPaint(currentStyle.strokePaint, currentStyle.strokeOpacity*100, "stroke")
						svgEditor.paintBox.fill.update(true)
						svgEditor.paintBox.stroke.update(true)
						addToHistory(batchCmd);
					}
				}
			},
		};
});
