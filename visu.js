// ----------------------------------------------------------------------------
// 
// Neugestaltetes UZSU Widget zur Bedienung UZSU Plugin
//
// Release responsive v 5.0
// notwendig smartvisu ab v2.8 (svg umstellung)
//
// Darstellung der UZSU Einträge und Darstellung Widget in Form eine Liste mit den Einträgen
// Umsetzung
// (c) Michael Würtenberger 2014,2015,2016
// 
//  APL 2.0 Lizenz
//
// Basis der Idee des dynamischen Popups übernommen von John Chacko
// 		jQuery Mobile runtime popup
// 		16. November 2012 · 0 Comments	 
// 		http://johnchacko.net/?p=44
//
// ----------------------------------------------------------------------------
// Basis der Architektur: document.update und document.click baut die handler in die Seite für das Popup ein.
// document.update kopiert bei einem update die Daten aus dem Backend (per Websocket) in das DOM Element ("uzsu") ein
// document.click übernimmt die Daten aus dem DOM Element in Variable des JS Bereichs und baut über runtimepopup 
// dynamisch header, body und footer des popup zusammen und hängt sie an die aktuelle seite an (append, pagecreate)
// danach werden die Daten aus den Variablen in die Elemente der Seite kopiert. Die Elemente der Seite bilden immer
// den aktuellen Stand ab und werden von dort in die Variablen zurückgespeichert, wenn notwendig (save, sort).
// In der Struktur können Zeilen angehängt (add) oder gelöscht werden (del). Dies geschieht immer parallel in den Variablen
// und den Elementen der Seite. Die Expertenzeilen werden immer sofort mit angelegt, sind aber zu Beginn nicht sichtbar.
// Beim verlassen des Popups werden die dynamisch angelegten DOM Elemente wieder gelöscht (remove).
//
// Datenmodell: Austausch über JSON Element
// 				{ 	"active" 	: bool, 
//					"list" 		: 					Liste von einträgen mit schaltzeiten
//					[	"active"	:false,			Ist der einzelne Eintrag darin aktiv ?
//						"rrule"		:'',			Wochen / Tag Programmstring
//						"time"		:'00:00',		Uhrzeitstring des Schaltpunktes / configuration
//						"value"		:0,				Wert, der gesetzt wird
//						"event":	'time',			Zeitevent (time) oder SUN (sunrise oder sunset)
//						"timeMin"	:'',			Untere Schranke SUN
//						"timeMax"	:'',			Oberere Schranke SUN
//						"timeCron"	:'00:00',		Schaltzeitpunkt
//						"timeOffset":''				Offset für Schaltzeitpunkt
//						"condition"	: 	{	Ein Struct für die Verwendung mit conditions (aktuell nur FHEM), weil dort einige Option mehr angeboten werden
//											"deviceString"	: text	Bezeichnung des Devices oder Auswertestring
//											"type"			: text	Auswertetype (logische Verknüpfung oder Auswahl String)
//											"value"			: text	Vergleichwert
//											"active"		: bool	Aktiviert ja/nein
//										}
//						"delayedExec": 	{	Ein Struct für die Verwendung mit delayed exec (aktuell nur FHEM), weil dort einige Option mehr angeboten werden
//											"deviceString"	: text	Bezeichnung des Devices oder Auswertestring
//											"type"			: text	Auswertetype (logische Verknüpfung oder Auswahl String)
//											"value"			: text	Vergleichwert
//											"active"		: bool	Aktiviert ja/nein
//										}
//						"holiday":		{
//											"workday"	: bool	Aktiviert ja/nein
//											"weekend" 	: bool	Aktiviert ja/nein
//										}
//					] 
//				}
// ----------------------------------------------------------------------------
// set browser and platform identification variables
// ----------------------------------------------------------------------------
var browserIdentificationVariable = document.documentElement;
	browserIdentificationVariable.setAttribute('data-useragent',navigator.userAgent);
	browserIdentificationVariable.setAttribute('data-platform', navigator.platform);
	browserIdentificationVariable.className += ((!!('ontouchstart' in window) || !!('onmsgesturechange' in window)) ? ' touch' : '');
//----------------------------------------------------------------------------
// Funktionen für das Handling des dicts aus dem und in das Backend
//----------------------------------------------------------------------------
function uzsuCollapseTimestring(response, designType){
	for (var numberOfEntry = 0; numberOfEntry < response.list.length; numberOfEntry++) {
		// zeitstring wieder zusammenbauen, falls Event <> 'time', damit wir den richtigen Zusammenbau im zeitstring haben
		var timeString = '';
		if(response.list[numberOfEntry].event === 'time'){
			// wenn der eintrag time ist, dann kommt die zeit rein
			response.list[numberOfEntry].time = response.list[numberOfEntry].timeCron;
		}
		else{
			// ansonsten wird er aus der bestandteilen zusammengebaut
			if(response.list[numberOfEntry].timeMin.length > 0){ 
				timeString = timeString + response.list[numberOfEntry].timeMin + '<';
			}
			timeString += response.list[numberOfEntry].event;
			if(response.list[numberOfEntry].timeOffset > 0){
				timeString = timeString + '+' + response.list[numberOfEntry].timeOffset + 'm';
			}
			else if(response.list[numberOfEntry].timeOffset < 0){
				timeString = timeString + response.list[numberOfEntry].timeOffset + 'm';
			}
			if(response.list[numberOfEntry].timeMax.length > 0){
				timeString = timeString + '<' + response.list[numberOfEntry].timeMax;
			}
			response.list[numberOfEntry].time = timeString;
		}
	}
}

//----------------------------------------------------------------------------
// Funktionen für den Seitenaufbau
//----------------------------------------------------------------------------
function uzsuBuildTableHeader(headline, designType, valueType, valueParameterList) {
	// Kopf und überschrift des Popups
	var tt = "";
	// hier kommt der Popup Container mit der Beschreibung ein Eigenschaften
	tt += 	"<div data-role='popup' data-overlay-theme='b' data-theme='a' class='messagePopup' id='uzsuPopupContent' data-dismissible = 'false' data-history='false' data-position-to='window'>" +
				"<div data-rel='back' data-role='button' data-icon='delete' data-iconpos='notext' class='ui-btn-right' id='uzsuClose'></div>" +
				"<div class='uzsuClear'>" +
					"<div class='uzsuPopupHeader'>" + headline + "</div>" +
					"<div class='uzsuTableMain' id='uzsuTable'>";
	return tt;
}

function uzsuBuildTableRow(numberOfRow, designType, valueType, valueParameterList) {
	// Tabelleneinträge
	var tt = "";
	// Liste für die Wochentage, damit ich später per Index darauf zugreifen kann
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	
	tt += 	"<div class='uzsuRow' id='uzsuNumberOfRow" + numberOfRow + "'>" +
				"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'>Weekday</div>" +
						"<form>" +
							"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>";
							for (var numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
								tt += "<input type='checkbox' id='checkbox" + numberOfDay	+ "-" + numberOfRow + "'> <label for='checkbox"	+ numberOfDay + "-" + numberOfRow + "'>" + weekDays[numberOfDay] + "</label>";
							}
	tt +=					"</fieldset>" +
						"</form>" +
					"</div>";
	if (valueType === 'bool') {
		// Unterscheidung Anzeige und Werte
		if (valueParameterList[0].split(':')[1] === undefined) {
			tt += 	"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Value</div>" +
						"<select name='UZSU' id='uzsuValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'> " +
							"<option value='0'>" + valueParameterList[1] + "</option>" +
							"<option value='1'> "	+ valueParameterList[0] + " </option>" +
						"</select>" +
					"</div>";
		} 
		else {
			tt += 	"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Value</div>" +
						"<select name='UZSU' id='uzsuValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'>" +
							"<option value='" + valueParameterList[1].split(':')[1]	+ "'>" + valueParameterList[1].split(':')[0] + "</option>" +
							"<option value='" + valueParameterList[0].split(':')[1]	+ "'> "	+ valueParameterList[0].split(':')[0] + " </option>" +
						"</select>" +
					"</div>";
		}
	} 
	else if (valueType === 'num') {
		tt += 	"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'>Value</div>" +
					"<input type='number' " + valueParameterList[0] + " data-clear-btn='false' class='uzsuValueInput' pattern='[0-9]*' id='uzsuValue" + numberOfRow + "'>" +
				"</div>";
	} 
	else if (valueType === 'text') {
		tt += 	"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'>Value</div>" +
					"<input type='text' data-clear-btn='false' class='uzsuTextInput' id='uzsuValue" + numberOfRow + "'>" +
				"</div>";
	} 
	else if (valueType === 'list') {
		// das Listenformat mit select ist sehr umfangreich nur einzubauen.
		tt += 	"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'>Value</div>" +
					"<form>" +
						"<div data-role='fieldcontain' class='uzsuListInput'>" +
							"<select name='uzsuValue'" + numberOfRow + "' id='uzsuValue" + numberOfRow + "' data-mini='true'>";
								for (var numberOfListEntry = 0; numberOfListEntry < valueParameterList.length; numberOfListEntry++) {
									// Unterscheidung Anzeige und Werte
									if (valueParameterList[0].split(':')[1] === undefined) {
										tt += "<option value='" + valueParameterList[numberOfListEntry].split(':')[0]	+ "'>"+ valueParameterList[numberOfListEntry].split(':')[0]	+ "</option>";
									} 
									else {
										tt += "<option value='" + valueParameterList[numberOfListEntry].split(':')[1]	+ "'>"+ valueParameterList[numberOfListEntry].split(':')[0]	+ "</option>";
									}
								}
		tt += 				"</select>" +
						"</div>" +
					"</form>" +
				"</div>";
	}
	tt+=	"<div class='uzsuCell'>" +
				"<div class='uzsuCellText'>Time</div>" +
				"<input type='time' data-clear-btn='false' class='uzsuTimeInput' id='uzsuTimeCron" + numberOfRow + "'>" +
			"</div>" +
			"<div class='uzsuCell'>" +
				"<div class='uzsuCellText'></div>" +
				"<form>" +
					"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
						"<input type='checkbox' id='uzsuActive"	+ numberOfRow + "'>" +
							"<label for='uzsuActive" + numberOfRow + "'>Act</label>" +
					"</fieldset>" +
				"</form>" +
			"</div>" +
			"<div class='uzsuCellExpert'>" +
				"<div class='uzsuCellText'>Expert</div>" +
				"<button id='uzsuExpert" + numberOfRow + "' data-mini='true' data-icon='arrow-d' data-iconpos='notext' class='ui-icon-shadow'></button>" +
			"</div>" +
			"<div class='uzsuCell'>" +
				"<div class='uzsuCellText'></div>" +
				"<button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del</button>" +
			"</div>";
	// Tabelle Zeile abschliessen 
	tt += "</div>";
	// und jetzt noch die unsichbare Expertenzeile
	tt += 	"<div class='uzsuRowExpHoli'>" +
				"<div class='uzsuRowExpert' id='uzsuExpertLine" + numberOfRow + "' style='display:none;float: left;'>" +
					"<div class='uzsuRowExpertText'>Sun</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>earliest</div>" +
						"<input type='time' data-clear-btn='false' class='uzsuTimeMaxMinInput' id='uzsuTimeMin" + numberOfRow + "'>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Event</div>" +
						"<form>" +
							"<div data-role='fieldcontain' class='uzsuEvent' >" +
								"<select name='uzsuEvent" + numberOfRow + "' id='uzsuEvent" + numberOfRow + "' data-mini='true'>" +
									"<option value='sunrise'>Sunrise</option>" +
									"<option value='sunset'>Sunset</option>" +
								"</select>" +
							"</div>" +
						"</form>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>+/- min</div>" +
						"<input type='number' data-clear-btn='false' class='uzsuTimeOffsetInput' id='uzsuTimeOffset" + numberOfRow + "'>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>latest</div>" +
						"<input type='time' data-clear-btn='false' class='uzsuTimeMaxMinInput' id='uzsuTimeMax" + numberOfRow + "'>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'></div>" +
						"<form>" +
							"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
								"<input type='checkbox' id='uzsuSunActive"	+ numberOfRow + "'>" +
									"<label for='uzsuSunActive" + numberOfRow + "'>Act</label>" +
							"</fieldset>" +
						"</form>" +
					"</div>" +
				"</div>";
					// hier die Einträge für holiday weekend oder nicht
		if (designType === '2'){
			tt += 	"<div class='uzsuRowHoliday' id='uzsuHolidayLine" + numberOfRow + "' style='display:none;float: left;'>" +
						"<div class='uzsuRowHolidayText'>Holiday</div>" +
						"<div class='uzsuCell'>" +
							"<div class='uzsuCellText'>Holiday</div>" +
							"<form>" +
								"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
									"<input type='checkbox' id='uzsuHolidayWorkday" + numberOfRow + "'> <label for='uzsuHolidayWorkday" + numberOfRow + "'>!WE</label>" +
				 					"<input type='checkbox' id='uzsuHolidayWeekend" + numberOfRow + "'> <label for='uzsuHolidayWeekend" + numberOfRow + "'>WE</label>" +
								"</fieldset>" +
							"</form>" +
						"</div>" +
					"</div>";
		}
		tt+= 	"</div>";
	// und jetzt noch die unsichbare Condition und delayed Exec Zeile
	if(designType == '2'){
		tt += 	"<div class='uzsuRowCondition' id='uzsuConditionLine" + numberOfRow + "' style='display:none;'>" +
					"<div class='uzsuRowConditionText'>Condition</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Device / String</div>" +
						"<input type='text' data-clear-btn='false' class='uzsuConditionDeviceStringInput' id='uzsuConditionDeviceString" + numberOfRow + "'>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Condition Type</div>" +
						"<form>" +
							"<div data-role='fieldcontain' class='uzsuEvent' >" +
								"<select name='uzsuCondition" + numberOfRow + "' id='uzsuConditionType" + numberOfRow + "' data-mini='true'>" +
									"<option value='eq'>=</option>" +
									"<option value='<'><</option>" +
									"<option value='>'>></option>" +
									"<option value='>='>>=</option>" +
									"<option value='<='><=</option>" +
									"<option value='ne'>!=</option>" +
									"<option value='String'>String</option>" +
								"</select>" +
							"</div>" +
						"</form>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Value</div>" +
						"<input type='text' data-clear-btn='false' class='uzsuConditionValueInput' id='uzsuConditionValue" + numberOfRow + "'>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'></div>" +
						"<form>" +
							"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
								"<input type='checkbox' id='uzsuConditionActive"	+ numberOfRow + "'>" +
									"<label for='uzsuConditionActive" + numberOfRow + "'>Act</label>" +
							"</fieldset>" +
						"</form>" +
					"</div>" +
				"</div>";
		// delayed exec zeile
		tt += 	"<div class='uzsuRowDelayedExec' id='uzsuDelayedExecLine" + numberOfRow + "' style='display:none;'>" +
					"<div class='uzsuRowDelayedExecText'>DelayedExec</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Device / String</div>" +
						"<input type='text' data-clear-btn='false' class='uzsuDelayedExecDeviceStringInput' id='uzsuDelayedExecDeviceString" + numberOfRow + "'>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>DelayedExec Type</div>" +
						"<form>" +
							"<div data-role='fieldcontain' class='uzsuEvent' >" +
								"<select name='uzsuDelayedExec" + numberOfRow + "' id='uzsuDelayedExecType" + numberOfRow + "' data-mini='true'>" +
									"<option value='eq'>=</option>" +
									"<option value='<'><</option>" +
									"<option value='>'>></option>" +
									"<option value='>='>>=</option>" +
									"<option value='<='><=</option>" +
									"<option value='ne'>!=</option>" +
									"<option value='String'>String</option>" +
								"</select>" +
							"</div>" +
						"</form>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Value</div>" +
						"<input type='text' data-clear-btn='false' class='uzsuDelayedExecValueInput' id='uzsuDelayedExecValue" + numberOfRow + "'>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'></div>" +
						"<form>" +
							"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
								"<input type='checkbox' id='uzsuDelayedExecActive"	+ numberOfRow + "'>" +
									"<label for='uzsuDelayedExecActive" + numberOfRow + "'>Act</label>" +
							"</fieldset>" +
						"</form>" +
					"</div>" +
				"</div>";
	}
	return tt;
}

function uzsuBuildTableFooter(designType) {
	var tt = "";
	// Zeileneinträge abschliessen und damit die uzsuTableMain
	tt += "</div>";
	// Aufbau des Footers
    tt += "<div class='uzsuTableFooter'>" +
    		"<div class='uzsuRowFooter'>" +
    			"<span style='float:right'>" +
    				"<div class='uzsuCellText'>v5.0</div>" +
    				"<div class='uzsuCell'>" +
	    				"<form>" +
	    					"<fieldset data-mini='true'>" +
	    						"<input type='checkbox' id='uzsuGeneralActive'>" +
	    							"<label for='uzsuGeneralActive'>Active</label>" +
	    					"</fieldset>" +
	    				"</form>" +
	    			"</div>" +
	    			"<div class='uzsuCell'>" +
						"<div data-role='controlgroup' data-type='horizontal' data-inline='true' data-mini='true'>" +
							"<div data-role = 'button' id='uzsuAddTableRow'>New</div>" +
							"<div data-role = 'button' id='uzsuSortTime'>Sort</div>" +
						"</div>" +
					"</div>" +
	    			"<div class='uzsuCell'>" +
	    					"<div data-role='controlgroup' data-type='horizontal' data-inline='true' data-mini='true'>" +
	    						"<div data-role = 'button' id='uzsuCancel'>Cancel</div>" +
	    						"<div data-role = 'button' id='uzsuSaveQuit'>OK</div>" +
	    					"</div>" +
	    				"</div>" +
	    			"</div>" +
	    		"</span>" +
    		"</div>";
	// und der Abschluss des uzsuClear als Rahmen für den float:left und des uzsuPopup divs
	tt += "</div></div>";
	return tt;
}
//----------------------------------------------------------------------------
// Funktionen für das dynamische Handling der Seiteninhalte des Popups
//----------------------------------------------------------------------------

// Setzt die Farbe des Expertenbuttons, je nach dem, ob eine der Optionen aktiv geschaltet wurde
function uzsuSetExpertColor(numberOfRow){
	if ($('#uzsuSunActive' + numberOfRow).is(':checked') || $('#uzsuConditionActive' + numberOfRow).is(':checked') || $('#uzsuDelayedExecActive' + numberOfRow).is(':checked') || $('#uzsuHolidayWorkday' + numberOfRow).is(':checked') || $('#uzsuHolidayWeekend' + numberOfRow).is(':checked')){
		$('#uzsuExpert' + numberOfRow).closest('div').addClass('ui-checkbox-on');
	}
	else{
		$('#uzsuExpert' + numberOfRow).closest('div').removeClass('ui-checkbox-on');
	}
}

// Toggelt die eingabemöglichkeit für SUN Elemente in Abhängigkeit der Aktivschaltung 
function uzsuSetSunActiveState(numberOfRow){
	// status der eingaben setzen, das brauchen wir an mehreren stellen
	if ($('#uzsuSunActive' + numberOfRow).is(':checked')){
		$('#uzsuTimeCron' + numberOfRow).val($('#uzsuEvent' + numberOfRow).val());
		$('#uzsuTimeCron' + numberOfRow).textinput('disable');
	}
	else{
		if($('#uzsuTimeCron' + numberOfRow).val().indexOf('sun')===0)
			$('#uzsuTimeCron' + numberOfRow).val('00:00');
		$('#uzsuTimeCron' + numberOfRow).textinput('enable');
	}
}

function uzsuFillTable(response, designType, valueType, valueParameterList) {
	// Tabelle füllen. Es werden die Daten aus der Variablen response gelesen und in den Status Darstellung der Widgetblöcke zugewiesen. Der aktuelle Status in dann in der Darstellung enthalten !
	var numberOfEntries = response.list.length;
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	// jetzt wird die Tabelle befüllt allgemeiner Status, bitte nicht mit attr, sondern mit prop, siehe	// https://github.com/jquery/jquery-mobile/issues/5587
	$('#uzsuGeneralActive').prop('checked', response.active).checkboxradio("refresh");
	// dann die Werte der Tabelle
	for (var numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
		// beim Schreiben der Daten Unterscheidung, da sonst das Element falsch genutzt wird mit Flipswitch für die bool Variante
		if (valueType == 'bool') {
			$('#uzsuValue' + numberOfRow).val(response.list[numberOfRow].value).slider("refresh");
		}
		// mit int Value für die num Variante
		else if ((valueType === 'num') || (valueType === 'text')) {
			$('#uzsuValue' + numberOfRow).val(response.list[numberOfRow].value);
		} 
		else if (valueType === 'list') {
			// hier ist es etwas schwieriger, denn ich muß den Wert mit der Liste vergleichen und dann setzen
			for (var numberOfListEntry = 0; numberOfListEntry < valueParameterList.length; numberOfListEntry++) {
				// wenn ich den Eintrag gefunden haben, dann setze ich den Eintrag auf die richtige Stelle ansonsten wird einfach der erste Eintrag genomme.
				// zusätzlich noch die Unterscheidung, ob ich in der Listen Anzeige und Wertezuweisung trenne
				if (valueParameterList[0].split(':')[1] === undefined) {
					if (response.list[numberOfRow].value == valueParameterList[numberOfListEntry].split(':')[0]) {
						$('#uzsuValue' + numberOfRow).val(valueParameterList[numberOfListEntry].split(':')[0]).attr('selected',true).siblings('option').removeAttr('selected');
						$('#uzsuValue' + numberOfRow).selectmenu('refresh', true);
					}
				} 
				else {
					if (response.list[numberOfRow].value == valueParameterList[numberOfListEntry].split(':')[1]) {
						$('#uzsuValue' + numberOfRow).val(valueParameterList[numberOfListEntry].split(':')[1]).attr('selected',true).siblings('option').removeAttr('selected');
						$('#uzsuValue' + numberOfRow).selectmenu('refresh', true);
					}
				}
			}
		}
		// Values in der Zeile setzen
		$('#uzsuActive' + numberOfRow).prop('checked',response.list[numberOfRow].active).checkboxradio("refresh");
	    // hier die conditions, wenn sie im json angelegt worden sind und zwar pro zeile !
	    if(designType === '2'){
	    	// Condition
	    	$('#uzsuConditionDeviceString'+numberOfRow).val(response.list[numberOfRow].condition.deviceString);
	    	$('#uzsuConditionType'+numberOfRow).val(response.list[numberOfRow].condition.type);
	    	$('#uzsuConditionType'+numberOfRow).selectmenu('refresh', true);
	    	$('#uzsuConditionValue'+numberOfRow).val(response.list[numberOfRow].condition.value);
	    	$('#uzsuConditionActive'+numberOfRow).prop('checked',response.list[numberOfRow].condition.active).checkboxradio("refresh");
	    	// Delayed Exec Zeile
	    	$('#uzsuDelayedExecDeviceString'+numberOfRow).val(response.list[numberOfRow].delayedExec.deviceString);
	    	$('#uzsuDelayedExecType'+numberOfRow).val(response.list[numberOfRow].delayedExec.type);
	    	$('#uzsuDelayedExecType'+numberOfRow).selectmenu('refresh', true);
	    	$('#uzsuDelayedExecValue'+numberOfRow).val(response.list[numberOfRow].delayedExec.value);
	    	$('#uzsuDelayedExecActive'+numberOfRow).prop('checked',response.list[numberOfRow].delayedExec.active).checkboxradio("refresh");
	    	// experten button ebenfalls auf die avtive farbe setzen
			$('#uzsuExpert' + numberOfRow).closest('div').addClass('ui-checkbox-on');
	    }
	    $('#uzsuTimeMin'+numberOfRow).val(response.list[numberOfRow].timeMin);
	    $('#uzsuTimeOffset'+numberOfRow).val(parseInt(response.list[numberOfRow].timeOffset));
	    $('#uzsuTimeMax'+numberOfRow).val(response.list[numberOfRow].timeMax);
	    $('#uzsuTimeCron'+numberOfRow).val(response.list[numberOfRow].timeCron);
	    // und die pull down Menüs richtig, damit die Einträge wieder stimmen und auch der active state gesetzt wird
	    if(response.list[numberOfRow].event === 'time'){
	    	$('#uzsuSunActive'+numberOfRow).prop('checked',false).checkboxradio("refresh");	
	    }
	    else{
	    	$('#uzsuSunActive'+numberOfRow).prop('checked',true).checkboxradio("refresh");
	    	$('#uzsuEvent'+numberOfRow).val(response.list[numberOfRow].event).attr('selected',true).siblings('option').removeAttr('selected');
	    }
	    // und der Refresh, damit es angezeigt wird
		$('#uzsuEvent'+numberOfRow).selectmenu('refresh', true);
		// in der Tabelle die Werte der rrule, dabei gehe ich von dem Standardformat FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU aus und setze für jeden Eintrag den Button.
		var rrule = response.list[numberOfRow].rrule;
		if (typeof rrule === "undefined") {
			rrule = '';
		}
		var ind = rrule.indexOf('BYDAY');
		// wenn der Standard drin ist
		if (ind > 0) {
			var days = rrule.substring(ind);
			// Setzen der Werte
			for (var numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
				$('#checkbox' + numberOfDay + '-' + numberOfRow).prop('checked', days.indexOf(weekDays[numberOfDay]) > 0).checkboxradio("refresh");
			}
		}
		// jetzt die holiday themem für fhem
		if(designType === '2'){
			$('#uzsuHolidayWorkday' + numberOfRow).prop('checked', response.list[numberOfRow].holiday.workday).checkboxradio("refresh");			
			$('#uzsuHolidayWeekend' + numberOfRow).prop('checked', response.list[numberOfRow].holiday.weekend).checkboxradio("refresh");			
		}
		// Fallunterscheidung für den Expertenmodus
		uzsuSetSunActiveState(numberOfRow);
		uzsuSetExpertColor(numberOfRow);
	}
}

function uzsuSaveTable(item, response, designType, valueType, valueParameterList, saveSmarthome) {
	// Tabelle auslesen und speichern
	var numberOfEntries = response.list.length;
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	// hier werden die Daten aus der Tabelle wieder in die items im Backend zurückgespielt bitte darauf achten, dass das zurückspielen exakt dem der Anzeige enspricht. Gesamthafte Aktivierung
	response.active = $('#uzsuGeneralActive').is(':checked');
	// Einzeleinträge
	for (var numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
		response.list[numberOfRow].value = $('#uzsuValue' + numberOfRow).val();
		response.list[numberOfRow].active = $('#uzsuActive' + numberOfRow).is(':checked');
		// hier die conditions, wenn im json angelegt
		if(designType == '2'){
			// conditions
			response.list[numberOfRow].condition.deviceString = $('#uzsuConditionDeviceString'+numberOfRow).val();
			response.list[numberOfRow].condition.type = $('#uzsuConditionType'+numberOfRow).val();
			response.list[numberOfRow].condition.value = $('#uzsuConditionValue'+numberOfRow).val();
			response.list[numberOfRow].condition.active = $('#uzsuConditionActive'+numberOfRow).is(':checked');
			// deleayed exec
			response.list[numberOfRow].delayedExec.deviceString = $('#uzsuDelayedExecDeviceString'+numberOfRow).val();
			response.list[numberOfRow].delayedExec.type = $('#uzsuDelayedExecType'+numberOfRow).val();
			response.list[numberOfRow].delayedExec.value = $('#uzsuDelayedExecValue'+numberOfRow).val();
			response.list[numberOfRow].delayedExec.active = $('#uzsuDelayedExecActive'+numberOfRow).is(':checked');
		}
		//response.list[numberOfRow].time = $('#uzsuTime'+numberOfRow).val();
		response.list[numberOfRow].timeMin = $('#uzsuTimeMin'+numberOfRow).val();
		response.list[numberOfRow].timeOffset = $('#uzsuTimeOffset'+numberOfRow).val();
		response.list[numberOfRow].timeMax = $('#uzsuTimeMax'+numberOfRow).val();
		response.list[numberOfRow].timeCron = $('#uzsuTimeCron'+numberOfRow).val();
		// event etwas komplizierter, da übergangslösung
	    if($('#uzsuSunActive'+numberOfRow).is(':checked')){
			response.list[numberOfRow].event = $('#uzsuEvent'+numberOfRow).val();
	    }
	    else{
			response.list[numberOfRow].event = 'time';
	    }		
		// in der Tabelle die Werte der rrule, dabei gehe ich von dem Standardformat FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU aus und setze für jeden Eintrag den Button. Setzen der Werte.
		var first = true;
		var rrule = '';
		for (var numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
			if ($('#checkbox' + numberOfDay + '-' + numberOfRow).is(':checked')) {
				if (first) {
					first = false;
					rrule = 'FREQ=WEEKLY;BYDAY=' + weekDays[numberOfDay];
				} 
				else {
					rrule += ',' + weekDays[numberOfDay];
				}
			}
		}
		response.list[numberOfRow].rrule = rrule;
		// jetzt die holiday themem für fhem
		if(designType === '2'){
			response.list[numberOfRow].holiday.workday = $('#uzsuHolidayWorkday' + numberOfRow).is(':checked');
			response.list[numberOfRow].holiday.weekend = $('#uzsuHolidayWeekend' + numberOfRow).is(':checked');
		}
	}
	// über json Interface / Treiber herausschreiben
	if (saveSmarthome) {
		uzsuCollapseTimestring(response, designType);
		io.write(item, {active : response.active,list : response.list});
	}
}
//----------------------------------------------------------------------------
// Funktionen für das Erweitern und Löschen der Tabelleneinträge
//----------------------------------------------------------------------------
function uzsuAddTableRow(response, designType, valueType, valueParameterList) {
	// Tabellenzeile einfügen
	var numberOfNewRow = response.list.length;	
	// alten Zustand mal in die Liste rein. da der aktuelle Zustand ja nur im Widget selbst enthalten ist, wird er vor dem Umbau wieder in die Variable response zurückgespeichert.
	uzsuSaveTable(1, response, designType, valueType, valueParameterList, false);
	// ich hänge immer an die letzte Zeile dran ! erst einmal das Array erweitern
	response.list.push({active:false,rrule:'',time:'00:00',value:0,event:'time',timeMin:'',timeMax:'',timeCron:'00:00',timeOffset:'',condition:{deviceString:'',type:'String',value:'',active:false},delayedExec:{deviceString:'',type:'String',value:'',active:false},holiday:{workday:false,weekend:false}});
	// dann eine neue HTML Zeile genenrieren
	tt = uzsuBuildTableRow(numberOfNewRow, designType, valueType,	valueParameterList);
	// Zeile in die Tabelle einbauen
	$('#uzsuTable').append(tt);
	// hier wichtig: damit die Optimierung jquerymobile auf Tabelle wirkt
	$.mobile.activePage.trigger('pagecreate');
	// den delete Handler für die neue Zeile einhängen
	$.mobile.activePage.find('#uzsuDelTableRow' + numberOfNewRow).bind('tap',function(e) {
		uzsuDelTableRow(response, designType, valueType,valueParameterList, e);
	});
	// den helper Handler für die neue Zeile einhängen
	$.mobile.activePage.find('#uzsuExpert' + numberOfNewRow).bind('tap', function(e) {
		uzsuShowExpertLine(e);
	});	
	// und Daten ausfüllen. hier werden die Zeile wieder mit dem Status beschrieben. Status ist dann wieder im Widget
	uzsuFillTable(response, designType, valueType, valueParameterList);
}

function uzsuDelTableRow(response, designType, valueType, valueParameterList, e) {
	// Tabellenzeile löschen
	var numberOfEntries = response.list.length;
	// wenn überhaupt Einträge vorhanden sind sollte nicht passieren, weil eigentlich auch kein Button dann da ist, aber...
	if (numberOfEntries > 0) {
		// Index heraussuchen, in welcher Zeile gelöscht wurde
		var numberOfRowToDelete = parseInt(e.currentTarget.id.substr(15));
		// zwischenspeichern vor dem löschen
		uzsuSaveTable(1, response, designType, valueType, valueParameterList, false);
		// erst mal das Array entsprechen kürzen
		response.list.splice(numberOfRowToDelete, 1);
		// jetzt die Tabelle kürzen im Popup und die vorhandene expertenzeile sowie bei design Type 2 die condition und delayed exec Zeile
		$('#uzsuNumberOfRow' + (numberOfRowToDelete)).remove();
		$('#uzsuExpertLine' + (numberOfRowToDelete)).remove();
		if (designType === '2'){
			$('#uzsuConditionLine' + (numberOfRowToDelete)).remove();
			$('#uzsuDelayedExecLine' + (numberOfRowToDelete)).remove();
		}
		// und Daten wieder ausfüllen
		uzsuFillTable(response, designType, valueType, valueParameterList);
	}
}

//Expertenzeile mit Eingaben auf der Hauptzeile benutzbar machen oder sperren bzw. die Statusupdates in die Zeile eintragen

function uzsuShowExpertLine(e) {
	// Tabellezeile ermitteln, wo augerufen wurde. es ist die 10. Stelle des aufrufenden Objektes
	var numberOfRow = parseInt(e.currentTarget.id.substr(10));
	// erst einmal alle verschwinden lassen
	uzsuHideAllExpertLines();
	// Zeile anzeigen
	$('#uzsuExpertLine'+numberOfRow).css('display','');
	if($('#uzsuHolidayLine'+numberOfRow).length){
		$('#uzsuHolidayLine'+numberOfRow).css('display','');
	}
	// Zeile für conditions anzeigen, wenn sie existieren
	if($('#uzsuConditionLine'+numberOfRow).length){
		$('#uzsuConditionLine'+numberOfRow).css('display','');		
	}
	// Zeile für delayedExec anzeigen, wenn sie existieren
	if($('#uzsuDelayedExecLine'+numberOfRow).length){
		$('#uzsuDelayedExecLine'+numberOfRow).css('display','');		
	}
	// jetzt noch den Button in der Zeile drüber auf arrow up ändern
	$('#uzsuExpert' + numberOfRow).buttonMarkup({ icon: 'arrow-u' });
	// und den Callback ändern
	$.mobile.activePage.find('#uzsuExpert' + numberOfRow).unbind('tap');
	$.mobile.activePage.find('#uzsuExpert' + numberOfRow).bind('tap', function(e) {
		// propagation stoppen, sonst wird die Zeile gleich wieder aufgemacht
		e.stopImmediatePropagation();
		uzsuHideExpertLine(e);
	});
	// Handler, um je nach Event die inputs zu Aktivieren / Deaktivieren reagiert auf die Änderung Active
	$.mobile.activePage.find('#uzsuSunActive' + numberOfRow).on('change', function (){
		uzsuSetSunActiveState(numberOfRow);
		uzsuSetExpertColor(numberOfRow);
	});
	// Handler, um je nach Event die inputs zu Aktivieren / Deaktivieren reagiert auf die Änderung des Buttons
	$.mobile.activePage.find('#uzsuHolidayWeekend' + numberOfRow).on('change', function (){
		uzsuSetExpertColor(numberOfRow);
	});
	// Handler, um je nach Event die inputs zu Aktivieren / Deaktivieren reagiert auf die Änderung des Buttons
	$.mobile.activePage.find('#uzsuHolidayWorkday' + numberOfRow).on('change', function (){
		uzsuSetExpertColor(numberOfRow);
	});
	// Handler, um den expert button Status zu setzen
	$.mobile.activePage.find('#uzsuConditionActive' + numberOfRow).on('change', function (){
		uzsuSetExpertColor(numberOfRow);
	});
	// Handler, um den expert button Status zu setzen
	$.mobile.activePage.find('#uzsuDelayedExecActive' + numberOfRow).on('change', function (){
		uzsuSetExpertColor(numberOfRow);
	});
	// Handler, um den Status anhand des Pulldowns SUN zu setzen
	$.mobile.activePage.find('#uzsuEvent' + numberOfRow).on('change', function (){
		uzsuSetSunActiveState(numberOfRow);
	});
}

function uzsuHideExpertLine(e) {
	// Tabellezeile ermitteln, wo aufgerufen wurde. es ist die 10. Stelle des aufrufenden Objektes
	var numberOfRow = parseInt(e.currentTarget.id.substr(10));
	// tabellenzeile löschen
	if ($('#uzsuExpertLine'+numberOfRow)) {
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuExpertLine'+numberOfRow).css('display','none');
		if($('#uzsuHolidayLine'+numberOfRow).length){
			$('#uzsuHolidayLine'+numberOfRow).css('display','none');
		}
		// auch für die Conditions
		if($('#uzsuConditionLine'+numberOfRow).length){
			$('#uzsuConditionLine'+numberOfRow).css('display','none');		
		}
		// und auch für den delayed exec
		if($('#uzsuDelayedExecLine'+numberOfRow).length){
			$('#uzsuDelayedExecLine'+numberOfRow).css('display','none');		
		}
		// jetzt noch den Button in der Zeile drüber ändern auf arrow down
		$('#uzsuExpert'+ numberOfRow).buttonMarkup({ icon: 'arrow-d' });
		// und den Callback ändern
		$.mobile.activePage.find('#uzsuExpert'+ numberOfRow).unbind('tap');
		$.mobile.activePage.find('#uzsuExpert'+ numberOfRow).bind('tap', function(e) {
			// Propagation stoppen, sonst wird die Zeile gleich wieder aufgemacht
			e.stopImmediatePropagation();
			uzsuShowExpertLine(e);
		});
	}
}

function uzsuHideAllExpertLines() {
	var numberOfEntries = $('.uzsuRowExpert').length;
	// tabellenzeile löschen
	for (var numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuExpertLine'+numberOfRow).css('display','none');
		if($('#uzsuHolidayLine'+numberOfRow).length){
			$('#uzsuHolidayLine'+numberOfRow).css('display','none');
		}
		// auch für die Conditions
		if($('#uzsuConditionLine'+numberOfRow).length){
			$('#uzsuConditionLine'+numberOfRow).css('display','none');		
		}
		// und auch für den delayed exec
		if($('#uzsuDelayedExecLine'+numberOfRow).length){
			$('#uzsuDelayedExecLine'+numberOfRow).css('display','none');		
		}
		// jetzt noch den Button in der Zeile drüber ändern auf arrow down
		$('#uzsuExpert'+ numberOfRow).buttonMarkup({ icon: 'arrow-d' });
		// und den Callback ändern
		$.mobile.activePage.find('#uzsuExpert'+ numberOfRow).unbind('tap');
		$.mobile.activePage.find('#uzsuExpert'+ numberOfRow).bind('tap', function(e) {
			// Propagation stoppen, sonst wird die Zeile gleich wieder aufgemacht
			e.stopImmediatePropagation();
			uzsuShowExpertLine(e);
		});
	}
}
//----------------------------------------------------------------------------
// Funktionen für das Sortrieren der Tabelleneinträge
//----------------------------------------------------------------------------
function uzsuSortFunction(a, b) {
	// sort Funktion, wirklich vereinfacht für den speziellen Fall
	// ergänzt um das sunrise und sunset Thema
	var A = a.timeCron.replace(':', '');
	var B = b.timeCron.replace(':', '');
	// Reihenfolge ist erst die Zeiten, dann sunrise, dann sunset 
	if(A == 'sunrise') A = '2400';
	if(A == 'sunset') A = '2400';
	if(B == 'sunrise') B = '2401';
	if(B == 'sunset') B = '2401';
	return (A - B);
}

function uzsuSortTime(response, designType, valueType, valueParameterList, e) {
	// erst aus dem Widget zurücklesen, sonst kann nicht im Array sortiert werden (alte daten)
	uzsuSaveTable(1, response, designType, valueType, valueParameterList, false);
	// sortieren der Listeneinträge nach zeit
	response.list.sort(uzsuSortFunction);
	// dann die Einträge wieder schreiben
	uzsuFillTable(response, designType, valueType, valueParameterList);
}
//----------------------------------------------------------------------------
// Funktionen für den Aufbau des Popups und das Einrichten der Callbacks
//----------------------------------------------------------------------------
function uzsuRuntimePopup(response, headline, designType, valueType, valueParameterList, item) {
	// Steuerung des Popups erst einmal wird der Leeranteil angelegt
	// erst den Header, dann die Zeilen, dann den Footer 
	var tt = uzsuBuildTableHeader(headline, designType, valueType, valueParameterList);
	for (var numberOfRow = 0; numberOfRow < response.list.length; numberOfRow++) {
		tt += uzsuBuildTableRow(numberOfRow, designType, valueType, valueParameterList);
	}
	tt += uzsuBuildTableFooter(designType);
	// dann hängen wir das an die aktuelle Seite
	$.mobile.activePage.append(tt).trigger('pagecreate');
	// dann speichern wir uns für cancel die ursprünglichen im DOM gespeicherten Werte in eine Variable ab
	var responseCancel = jQuery.extend(true, {}, response);
	// dann die Werte eintragen.
	uzsuFillTable(response, designType, valueType, valueParameterList);
	// Popup schliessen mit close rechts oben in der Box
	$.mobile.activePage.find('#uzsuClose').bind('tap', function(e) {
		// wenn keine Änderungen gemacht werden sollen (cancel), dann auch im cache die alten Werte
		$.mobile.activePage.find('#uzsuPopupContent').popup('close');
	});
	// Popup schliessen mit Cancel in der Leiste
	$.mobile.activePage.find('#uzsuCancel').bind('tap', function(e) {
		// wenn keine Änderungen gemacht werden sollen (cancel), dann auch im cache die alten Werte
		$.mobile.activePage.find('#uzsuPopupContent').popup('close');
	});
	// speichern mit SaveQuit
	$.mobile.activePage.find('#uzsuSaveQuit').bind('tap', function(e) {
		// jetzt wird die Kopie auf das Original kopiert und geschlossen
		uzsuSaveTable(item, response, designType, valueType, valueParameterList, true);
		$.mobile.activePage.find('#uzsuPopupContent').popup('close');
	});
	// Eintrag hinzufügen mit add
	$.mobile.activePage.find('#uzsuAddTableRow').bind('tap', function(e) {
		uzsuAddTableRow(response, designType, valueType, valueParameterList);
	});
	// Eintrag sortieren nach Zeit
	$.mobile.activePage.find('#uzsuSortTime').bind('tap', function(e) {
		uzsuSortTime(response, designType, valueType, valueParameterList);
	});
	// Löschen mit del als Callback eintragen
	for (numberOfRow = 0; numberOfRow < response.list.length; numberOfRow++) {
		$.mobile.activePage.find('#uzsuDelTableRow' + numberOfRow).bind('tap',function(e) {
			uzsuDelTableRow(response, designType, valueType, valueParameterList, e);
		});
		// call Expert Mode
		$.mobile.activePage.find('#uzsuExpert'+ numberOfRow).bind('tap', function(e) {
			uzsuShowExpertLine(e);
		});
	}
	// hier wir die aktuelle Seite danach durchsucht, wo das Popup ist und im folgenden das Popup initialisiert, geöffnet und die schliessen
	// Funktion daran gebunden. Diese entfernt wieder das Popup aus dem DOM Baum nach dem Schliessen mit remove
	$.mobile.activePage.find('#uzsuPopupContent').popup('open').bind({
		popupafterclose: function () {
			$(this).remove();
		}
	});
}
//----------------------------------------------------------------------------
//Funktionen für das Verankern des Popup auf den Webseiten
//----------------------------------------------------------------------------
function uzsuDomUpdate(event, response) {
	// Initialisierung zunächst wird festgestellt, ob Item mit Eigenschaft vorhanden. Wenn nicht: active = false
	// ansonsten ist der Status von active gleich dem gesetzten Status
	var active;
	// erst einmal prüfen, ob ein Objekt tasächlich vohanden ist
	if(response.length > 0) {
		active = response[0].active;
	} 
	else{
		active = false;
	}	
	// Das Icon wird aktiviert, falls Status auf aktiv, ansonsten deaktiviert angezeigt. Basiert auf der Implementierung von aschwith
	if(active === true) {
		$('#' + this.id + '-off').hide();
		$('#' + this.id + '-on').show();
	}
	else {
		$('#' + this.id + '-on').hide();
		$('#' + this.id + '-off').show();
	}	
	// wenn keine Daten vorhanden, dann ist kein item mit den eigenschaften hinterlegt und es wird nichts gemacht
	if (response.length === 0){
		alert('DOM Daten für UZSU nicht vorhanden! Item-ID auf HTML Seite falsch konfiguriert oder nicht vorhanden ! (update-event)');
		return;
	}
	// Wenn ein Update erfolgt, dann werden die Daten erneut in die Variable uzsu geladen damit sind die UZSU objekte auch in der click Funktion verfügbar
	if (response[0].list instanceof Array) {
		$(this).data('uzsu', response[0]);
	} 
	else {$(this).data('uzsu', {active : true,list : []	});
	}
}

function uzsuDomClick(event) {
	// hier werden die Parameter aus den Attributen herausgenommen und beim Öffnen mit .open(....) an das Popup Objekt übergeben
	// und zwar mit deep copy, damit ich bei cancel die ursprünglichen werte nicht überschrieben habe
	var response = jQuery.extend(true, {}, $(this).data('uzsu'));
	// erst gehen wir davon aus, dass die Prüfungen positiv und ein Popup angezeigt wird
	var popupOk = true;
	// Fehlerbehandlung für ein nicht vorhandenes DOM Objekt. Das response Objekt ist erst da, wenn es mit update angelegt wurde. Da diese
	// Schritte asynchron erfolgen, kann es sein, dass das Icon bereits da ist, clickbar, aber nocht keine Daten angekommen. Dann darf ich nicht auf diese Daten zugreifen wollen !
	if(response.list === undefined){ 
		alert('DOM Daten für UZSU nicht vorhanden! Item-ID auf HTML Seite falsch konfiguriert oder nicht vorhanden ! (click-event)');
	}
	else{
	 	// Auswertung der Übergabeparameter aus dem HTML Widget
		var headline = $(this).attr('data-headline');
		var designType = $(this).attr('data-designType');
		var valueType = $(this).attr('data-valueType');
		// hier wird die komplette Liste übergeben. widget.explode kehrt das implode aus der Webseite wieder um
		var valueParameterList = widget.explode($(this).attr('data-valueParameterList'));
		// default Werte setzen fuer valueParameterList
		if(valueParameterList.length === 0){
			if(valueType === 'bool') valueParameterList = ['On','Off'];
			else if (valueType === 'num') valueParameterList = [''];
			else if (valueType === 'text') valueParameterList = [''];
			else if (valueType === 'list') valueParameterList = [''];
		}
		//
		// Umsetzung des time parameters in die Struktur, die wir hinterher nutzen wollen
		//
		for (var numberOfRow = 0; numberOfRow < response.list.length; numberOfRow++) {
			// test, ob die einträge für holiday gesetzt sind
			if (response.list[numberOfRow].event === 'time')
				response.list[numberOfRow].timeCron = response.list[numberOfRow].time;
			else
				response.list[numberOfRow].timeCron = '00:00';
		}
		// data-item ist der sh.py item, in dem alle Attribute lagern, die für die Steuerung notwendig ist ist ja vom typ dict. das item, was tatsächlich per
		// Schaltuhr verwendet wird ist nur als attribut (child) enthalten und wird ausschliesslich vom Plugin verwendet. wird für das rückschreiben der Daten an smarthome.py benötigt
		var item = $(this).attr('data-item');
		// jetzt kommt noch die Liste von Prüfungen, damit hinterher keine Fehler passieren, zunächst fehlerhafter designType (unbekannt)
		if ((designType !== '0') && (designType !== '2')) {
			alert('Fehlerhafter Parameter: "' + designType + '" im Feld designType bei Item ' + item + '. Design Type wird nicht unterstützt !');
			popupOk = false;
		}
		// fehlerhafter valueType (unbekannt)
		if ((valueType !== 'bool') && (valueType !== 'num')	&& (valueType !== 'text') && (valueType !== 'list')) {
			alert('Fehlerhafter Parameter: "' + valueType + '" im Feld valueType bei Item ' + item + '. Value Type wird nicht unterstützt !');
			popupOk = false;
		}
		// bei designType '0' wird rrule nach Wochentagen umgewandelt und ein festes Format vogegegeben hier sollte nichts versehentlich überschrieben werden
		if (designType == '0') {
			for (var numberOfRow = 0; numberOfRow < response.list.length; numberOfRow++) {
				// test, ob die RRULE fehlerhaft ist
				if ((response.list[numberOfRow].rrule.indexOf('FREQ=WEEKLY;BYDAY=') !== 0) && (response.list[numberOfRow].rrule.length > 0)) {
					if (!confirm('Fehler: Parameter designType ist "0", aber gespeicherte RRULE String in UZSU "' + response.list[numberOfRow].rrule + '" entspricht nicht default Format FREQ=WEEKLY;BYDAY=MO... bei Item ' + item	+ '. Soll dieser Eintrag überschrieben werden ?')) {
						// direkter Abbruch bei der Entscheidung !
						numberOfRow = numberOfEntries;
						popupOk = false; 
					}
				}
			}
		}
		// wenn bei valueType = 'list' und 'bool' ein Split angegeben wird, dann muss er immer angegeben sein
		if (((valueType == 'list') || (valueType == 'bool')) && (valueParameterList[0].split(':')[1] !== undefined)) {
			for (var numberOfTextEntries = 0; numberOfTextEntries < valueParameterList.length; numberOfTextEntries++) {
				if (valueParameterList[numberOfTextEntries].split(':')[1] === undefined) {
					alert('Fehlerhafte Einträge im Parameter valueParameterList !');
					popupOk = false;
				}
			}
		}
		// wenn designType = '2' und damit fhem auslegung ist muss der JSON String auf die entsprechenden eintäge erwietert werden (falls nichts vorhanden)
		if (designType == '2') {
			for (var numberOfRow = 0; numberOfRow < response.list.length; numberOfRow++){
				// test, ob die einträge für conditions vorhanden sind
				if (response.list[numberOfRow].condition === undefined){
					response.list[numberOfRow].condition = {deviceString:'',type:'String',value:'',active:false};
				}
				// test, ob die einträge für delayed exec vorhanden sind
				if (response.list[numberOfRow].delayedExec === undefined){
					response.list[numberOfRow].delayedExec = {deviceString:'',type:'String',value:'',active:false};
				}
				// test, ob die einträge für holiday gesetzt sind
				if (response.list[numberOfRow].holiday === undefined){
					response.list[numberOfRow].holiday = {workday:false, weekend:false};
				}
			}
		}		
		if (popupOk) {
			// Öffnen des Popups bei clicken des icons und Ausführung der Eingabefunktion
			uzsuRuntimePopup(response, headline, designType, valueType, valueParameterList, item);
		}
	}
}
// Verankerung als Callback in den DOM Elementen
$(document).on('update','[data-widget="uzsu.uzsu_icon"]', uzsuDomUpdate);
$(document).on('click','[data-widget="uzsu.uzsu_icon"]', uzsuDomClick);
