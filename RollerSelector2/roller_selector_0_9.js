"use strict";

/*
 * Author: Atte Virtanen
 * Initial version: 22.6.2014
 * 
 * Description:
 * An eyePhone/eyeOS like "Roller"/"Spinner" javascript selection control
 * 
 * License:
 * MIT License
 * 
 * Version:
 * 0.9
 * 
 */


/***
 * Method:	"RollerSelector": Creates a roller selector object for the div, which id is given as a param.
 * 
 * Args:
 * "div_element_id":	the element inside which the roller goes
 * "options" object with the following properties:
 *
 * array_values:	values in the list (all values must be unique)
 * selected_value:	selected value
 * line_height_px:	the options.height_px of an item in the list in pixels
 * value_has_changed_callback:	a function, which is called when the selection has changed, gets as an argument the selected value
 * 
 * the following params are not required:
 * 
 * initial_value_can_be_null:	the options.selected_value at the beginning can be null (must be changed by user, to get a value)
 * oheight_px and options.width_px:	integers in pixels (not required -> see beginning of function)
 * array_texts:	if the values don't want to be shown but texts instead of them
 * show_square_brackets_on_selection:	[ ] characters show the selection (no css needed)
 *
 * Example:
 * 
 * var options = 
 *	{
 *		array_values: ["id of apple","id of orange","id of kiwi","id of pineapple"], 
 *		selected_value: null, 
 *		line_height_px: 35, //px 
 *		value_has_changed_callback: on_roller_selector_2_change, // a function (selected value comes as arg)
 *		initial_value_can_be_null: true, // not required
 *		height_px: 125, //px not required
 *		width_px: 100, //px not required
 *		array_texts: ["apple","orange","kiwi","pineapple"], // not required
 *		selected_value_if_value_null: "id of orange", // not required
 *		show_square_brackets_on_selection: false // not required
 *	}
 *
 * Returns:
 * the roller selector object (which has val() and val(selected_value) methods)
 */
function RollerSelector(div_element_id, options)
{
	//Global consts
	var DEFAULT_INDICATOR_PADDING = 0; //em
	var DEFAULT_WIDTH = 120; //px
	var DEFAULT_HEIGHT = 4; //rows
	
	//"validation" before setting defaults
	if(options.array_values.length < 1)
		throw "At least one value must be given in the values array (options.array_values)";
	
	setDefaults();
	
	if(options.array_texts.length != options.array_values.length)
		throw "The amount of values (options.array_values) and texts (options.array_texts) is different";

	var value_has_changed = false;
	var offY = 0;
	
	var draggableDivId = div_element_id + "_draggable";
	var index_of_sel_val = options.array_values.indexOf(options.selected_value);
	
	//simply if value is null then the first value is selected (although the callback has not been called and therefore a selection has not been made)
	if(index_of_sel_val == -1 && options.initial_value_can_be_null === true && options.selected_value === null)
		index_of_sel_val = 0;
	
	if(index_of_sel_val == -1)
		throw "Selected value ("+options.selected_value+") is not contained in the options.array_values. If you want the initial value to be null, then set initial_value_can_be_null = true and selected_value_if_value_null = value shown as selected in the beginning (val() still returns null).";

	//set the selection in the middle of the control
	var selection_offset = 0.5 * (options.height_px - options.line_height_px);
	//offset depending on the selected item at start
	var offset_at_start = selection_offset - index_of_sel_val * options.line_height_px;
	var len_array_values = options.array_values.length;
	//the height (px) of all items together (for stopping)
	var values_height = options.line_height_px * (len_array_values - 1);
	var jquery_obj = $("#" + div_element_id);
	
	render();
	initializeDragEvents();
	
	/***
	 * Private methods:
	 */
	
	function setDefaults()
	{
		var default_options = 
	 	{
	 		/* required:
	 		  array_values: [], 
	 		selected_value: null, 
	 		line_height_px: 35, //px 
	 		value_has_changed_callback: on_roller_selector_2_change, // a function (selected value comes as arg)
	 		*/
	 		initial_value_can_be_null: false, // not required
	 		height_px: options.line_height_px * DEFAULT_HEIGHT, //px not required
	 		width_px: DEFAULT_WIDTH, //px not required
	 		array_texts: options.array_values, // not required
	 		selected_value_if_value_null: options.array_values[0], // not required
	 		show_square_brackets_on_selection: true // not required
	 	};
		
		options = $.extend(default_options, options || {});

	}
	
	function render()
	{
		jquery_obj.css(
			{
				"height":'' + options.height_px + 'px',
				"width":'' + options.width_px + 'px',
				"position":"relative",
				"overflow":"hidden",
				"white-space": "nowrap",
				"webkit-touch-callout": "none",
				"-webkit-user-select": "none",
				"-khtml-user-select": "none",
				"-moz-user-select": "none",
				"-ms-user-select": "none",
				"user-select": "none", 
				"cursor":"ns-resize"
			}
		);
	
		var str_html = "<div id='"+draggableDivId+"' class='roller_selector_roller' " +
				"style='position:absolute;text-align:center;width:100%;top:"+
			 offset_at_start+"px;line-height:"+options.line_height_px+"px;'>";
		
		for(var i in options.array_texts)
			str_html += '' + options.array_texts[i] + (i < (len_array_values - 1) ? "<br />" : "");
	
		str_html += "</div>";
		
		if(options.show_square_brackets_on_selection)
		{
			//get maximum width of item text for setting the square_brackets distance 
			//from each other
			var max_value_str_length = 0;
			for(var i in options.array_texts)
			{
				var str_length = options.array_texts[i].toString().length;
				if(str_length > max_value_str_length)
					max_value_str_length = str_length;
			}
			
			str_html += "<div style='position:absolute;top:"+selection_offset+"px;line-height:"+options.line_height_px+"px;text-align:center;width:100%;'>" +
						"<div style='margin-left:auto;margin-right:auto;width:"+ (max_value_str_length + DEFAULT_INDICATOR_PADDING * 2) + "em;" +
							"position:relative;height:"+options.line_height_px+"px;max-width:"+options.width_px+"px'>" +
									"<div style='position:absolute;left:0px;top:0px;'>[</div>" +
								"<div style='position:absolute;right:0px;top:0px;'>]</div>" +
		                 		"</div>" +
							"</div>";
		}
		
		str_html += "<div class='roller_selector_glass' style='position:absolute;left:0px;top:0px;width:" + options.width_px + "px;height:" + options.height_px + "px;'>" +
					"</div>";
		
		jquery_obj.html(str_html);	
	}
	
	function initializeDragEvents()
	{
		//take away the default movement of the draggable feature of jquery ui
		jquery_obj.draggable(
			{
				drag: function(event, ui) {
				    ui.position.top = 0;
				    ui.position.left = 0;
				  }
			});
		
		jquery_obj.on("dragstart", 
			function (e)
			{
				var div = $('#' + draggableDivId)[0];
			    offY = e.clientY-parseInt(div.offsetTop);
			}
		);
		
		jquery_obj.on("drag", 
		    	function (e)
				{
		    		var div = $('#' + draggableDivId)[0];
		    		var pos = e.clientY - offY;
		    		if(pos > selection_offset)
		    			pos = selection_offset;
		    		else if(pos < selection_offset - values_height)
		    			pos = selection_offset - values_height;
				    div.style.top = '' + pos + 'px';
				} 
		    );
		
		jquery_obj.on("dragstop", 
			function (e)
			{
			
			    var div = $('#' + draggableDivId)[0];
			    offY = parseInt(div.offsetTop) - 0.5 * options.line_height_px;
			    var diff = offY - selection_offset;
			    offY = offY - (diff % options.line_height_px);
			    div.style.top = offY + 'px';
			    var selected_value_index = Math.round(-(offY - selection_offset) / options.line_height_px);
			    var selected_value1 = options.array_values[selected_value_index];	
			    value_has_changed = true;
			    options.value_has_changed_callback(selected_value1);
			});
	}
	
	
	/***
	 * Public methods:
	 */
	
	/***
	 * Method: sets (if an argument is given) the selected value of the RollerSelector object 
	 * 		   gets (if no argument is given) the selected value
	 * 
	 * Note: Setting the value using this method does not call the options.value_has_changed_callback-method
	 * 
	 * Args:
	 * options.selected_value: the value, which is selected (if not given returns the selected value)
	 * 
	 * Returns:
	 * the selected value (if no argument is given)
	 */
	this.val = function(selected_value1)
	{
		if(typeof selected_value1 != 'undefined')
		{
			var index = options.array_values.indexOf(selected_value1);
			var div = $('#' + draggableDivId)[0];
			var pos = selection_offset - index * options.line_height_px;
			div.style.top = pos + 'px';	
			
			//well this depends on the usage whether the programmatically changed value
			//actually changes the value gotten
			value_has_changed = true;
		}
		else
		{
			if(!value_has_changed && options.selected_value == null)
				return null;
			
			var div = $('#' + draggableDivId)[0];
			var pos = parseInt(div.offsetTop) - 0.5 * options.line_height_px;
			var diff = pos - selection_offset;
			pos = pos - (diff % options.line_height_px);
			var selected_value_index = Math.round(-(pos - selection_offset) / options.line_height_px);
			var selected_value1 = options.array_values[selected_value_index];
			return selected_value1;
		}
	};
}

/***
 * Add RollerSelector to the jquery object (for people who like the jquery syntax)
 */

/***
 * Method:	"rollerSelector": Creates a roller selector inside the "jQuery selected" element (should be div and ONLY ONE ELEMENT AT A TIME)
 * 
 * Args:
 *
 * "options" object with the following properties:
 *
 * array_values:	values in the list (all values must be unique)
 * selected_value:	selected value
 * line_height_px:	the options.height_px of an item in the list in pixels
 * value_has_changed_callback:	a function, which is called when the selection has changed, gets as an argument the selected value
 * 
 * the following params are not required:
 * 
 * initial_value_can_be_null:	the options.selected_value at the beginning can be null (must be changed by user, to get a value)
 * oheight_px and options.width_px:	integers in pixels (not required -> see beginning of function)
 * array_texts:	if the values don't want to be shown but texts instead of them
 * show_square_brackets_on_selection:	[ ] characters show the selection (no css needed)
 *
 * Example:
 * 
 * var options = 
 *	{
 *		array_values: ["id of apple","id of orange","id of kiwi","id of pineapple"], 
 *		selected_value: null, 
 *		line_height_px: 35, //px 
 *		value_has_changed_callback: on_roller_selector_2_change, // a function (selected value comes as arg)
 *		initial_value_can_be_null: true, // not required
 *		height_px: 125, //px not required
 *		width_px: 100, //px not required
 *		array_texts: ["apple","orange","kiwi","pineapple"], // not required
 *		selected_value_if_value_null: "id of orange", // not required
 *		show_square_brackets_on_selection: false // not required
 *	}
 *
 * 
 * Returns:
 * the roller selector object (which has val() and val(selected_value) methods)
 */
$.fn.rollerSelector = function rollerSelector(options)
{
	var J_QUERY_DATA_KEY = 'rollerSelector';
	
	if(this.length != 1)
		throw "rollerSelector can only be applied to a single element at a time. Select only one element at a time to apply the rollerSelector!";

	var element = this;
	//if is created already, return created object
	if (element.data(J_QUERY_DATA_KEY)) 
		return element.data(J_QUERY_DATA_KEY);

	var elem_id = element.attr('id');
	var rs = new RollerSelector(elem_id, options);
	//set jQuery element data
        element.data(J_QUERY_DATA_KEY, rs);
	return rs;
};