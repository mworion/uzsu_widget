// ----------------------------------------------------------------------------
// 
// Neugestaltetes UZSU Widget zur Bedienung UZSU Plugin
//
// Release responsive v4.3
// läuft nur mit smartvisu ab v2.8 (svg umstellung)
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
//						"event":	'time',			Erweiterung zur Laufzeit: Zeitevent oder SUN
//						"timeMin"	:'',			Untere Schranke SUN
//						"timeMax"	:'',			Oberere Schranke SUN
//						"timeCron"	:'00:00',		Schaltzeitpunkt
//						"timeOffset":''				Offset für Schaltzeitpunkt
//						"condition"	: 	{			Ein Struct für die Verwendung mit FHEM conditions, weil dort einige Option mehr angeboten werden
//											"conditionDevicePerl"	: text
//											"conditionType"			: text
//											"conditionValue"		: text
//											"conditionActive"		: bool
//										}
//						"holiday":		{
//											"work"		: bool
//											"weekend" 	: bool
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
		// und den string setzen, bei designtype = 1 bleibt er bestehen, wird nicht geändert
		if((designType == '0') || (designType == '2')){
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
}

function uzsuExpandTimestring(response){
	// ist aus cron von schedule.py aus sh.py übernommen und nach js portiert
	var timeCron = '';
	var timeMin = '';
	var timeMax = '';
	var timeOffset = '';
	var event = '';
	var tabsTime = '';
	for (var numberOfEntry = 0; numberOfEntry < response.list.length; numberOfEntry++) {
		timeCron = '';
	    tabsTime = response.list[numberOfEntry].time.split('<');
	    if(tabsTime.length == 1){
	    	timeMin = '';
	        timeMax = '';
	        if (tabsTime[0].trim().indexOf('sunrise')===0){
	        	event = 'sunrise';
	        }
	        else if (tabsTime[0].trim().indexOf('sunset')===0){
	        	event = 'sunset';
	        }
	        else{
	        	event = 'time';
	            timeCron = tabsTime[0].trim();
	        }
	    }
	    else if(tabsTime.length == 2){
	        if(tabsTime[0].indexOf('sunrise')===0){
	        	timeMin = '';
	        	event = 'sunrise';
	        	timeMax = tabsTime[1].trim();
	        }
	        else if(tabsTime[0].indexOf('sunset')===0){
	        	timeMin = '';
	        	event = 'sunset';
	        	timeMax = tabsTime[1].trim();
	        }
	        else{
	        	timeMin = tabsTime[0].trim();
	        	timeMax = '';
		    	event = tabsTime[1].trim();
	            if(event.indexOf('sunrise')===0) event = 'sunrise'; else event = 'sunset';
	        }
	    }
	    else if(tabsTime.length == 3){
	    	timeMin = tabsTime[0].trim();
	    	timeMax = tabsTime[2].trim();
	    	event = tabsTime[1].trim();
	        if(event.indexOf('sunrise')===0) event = 'sunrise'; else event = 'sunset';
	    }
	    else{
	    	// Formatfehler ! ich nehme dann Defaulteinstellung an
	    	timeMin = '';
	    	event = 'time';
	    	timeMax = '';
	    }
	    // nun noch der Offset herausnehmen
	    var tabsOffset = response.list[numberOfEntry].time.split('+');
	    if(tabsOffset.length == 2){
	    	// dann steht ein plus drin
	    	tabsOffset = tabsOffset[1].split('m');
	    	timeOffset = '+' + tabsOffset[0].trim();
	    }
	    tabsOffset = response.list[numberOfEntry].time.split('-');
	    if(tabsOffset.length == 2){
	    	// dann steht ein minus drin
	    	tabsOffset = tabsOffset[1].split('m');
	    	timeOffset = '-' + tabsOffset[0].trim();
	    }
	    // zuweisung der neuen Werte im dict
		response.list[numberOfEntry].timeMin = timeMin;
		response.list[numberOfEntry].timeMax = timeMax;
		response.list[numberOfEntry].timeCron = timeCron;
		response.list[numberOfEntry].timeOffset = timeOffset;
		response.list[numberOfEntry].event = event;
		if(event != 'time') response.list[numberOfEntry].timeCron = event;
	}
}
//----------------------------------------------------------------------------
// Funktionen für den Seitenaufbau
//----------------------------------------------------------------------------
function uzsuBuildTableHeader(headline, designType, valueType, valueParameterList) {
	// Kopf und überschrift des Popups
	var tt = "";
	// hier kommt der Popup Container mit der Beschreibung ein Eigenschaften
	tt += 	"<div data-role='popup' data-overlay-theme='b' data-theme='a' class='messagePopup' id='uzsuPopupContent' data-dismissible = 'false'>" +
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
	
	tt += 	"<div class='uzsuRow' id='uzsuNumberOfRow" + numberOfRow + "'>";
	if ((designType === '0') || (designType === '2')){
		tt+=	"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'>Weekday</div>" +
					"<form>" +
						"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>";
							for (var numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
								tt += "<input type='checkbox' id='checkbox" + numberOfDay	+ "-" + numberOfRow + "'> <label for='checkbox"	+ numberOfDay + "-" + numberOfRow + "'>" + weekDays[numberOfDay] + "</label>";
							}
		tt +=			"</fieldset>" +
					"</form>" +
				"</div>";
	}
	// hier die Einträge für holiday weekend oder nicht
	if (designType === '2'){
		tt+=	"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'>Holiday</div>" +
					"<form>" +
						"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
							"<input type='checkbox' id='holidayWork" + numberOfRow + "'> <label for='holidayWork" + numberOfRow + "'>!WE</label>" +
		 					"<input type='checkbox' id='holidayWeekend" + numberOfRow + "'> <label for='holidayWeekend" + numberOfRow + "'>WE</label>" +
						"</fieldset>" +
					"</form>" +
				"</div>";
	}
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
	if((designType == '0') || (designType == '2')){
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
	}
	else{
		tt += 	"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'></div>" +
					"<form>" +
						"<fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>" +
							"<input type='checkbox' id='uzsuActive"	+ numberOfRow + "'> " +
								"<label for='uzsuActive" + numberOfRow + "'>Act</label>" +
						"</fieldset>" +
					"</form>" +
				"</div>" +
				"<div class='uzsuCell'> " +
					"<div class='uzsuCellText'></div>" +
					"<button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del</button>" +
				"</div>" + 
				"<div class='uzsuCellType1'>" +
					"<input type='text' class='uzsuTextWideInput' data-clear-btn='true' id='uzsuTime" + numberOfRow + "'>" +
					"<input type='text' class='uzsuTextWideInput' data-clear-btn='true' id='uzsuRrule" + numberOfRow + "'>" +
				"</div>";
	}
	// Tabelle Reihen abschliessen 
	tt += "</div>";
	// und jetzt noch die unsichbare Expertenzeile
	tt += 	"<div class='uzsuRowExpert' id='uzsuExpertLine" + numberOfRow + "' style='display:none;'>" +
				"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'>earliest</div>" +
					"<input type='time' data-clear-btn='false' class='uzsuTimeMaxMinInput' id='uzsuTimeMin" + numberOfRow + "'>" +
				"</div>" +
				"<div class='uzsuCell'>" +
					"<div class='uzsuCellText'>Event</div>" +
					"<form>" +
						"<div data-role='fieldcontain' class='uzsuEvent' >" +
							"<select name='uzsuEvent" + numberOfRow + "' id='uzsuEvent" + numberOfRow + "' data-mini='true'>" +
								"<option value='time'>Time</option>" +
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
			"</div>";	
	// und jetzt noch die unsichbare Condition Zeile
	if(designType == '2'){
		tt += 	"<div class='uzsuRowCondition' id='uzsuConditionLine" + numberOfRow + "' style='display:none;'>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Device / Perl String</div>" +
						"<input type='text' data-clear-btn='false' class='uzsuConditionDevicePerlInput' id='uzsuConditionDevicePerl" + numberOfRow + "'>" +
					"</div>" +
					"<div class='uzsuCell'>" +
						"<div class='uzsuCellText'>Condition Type</div>" +
						"<form>" +
							"<div data-role='fieldcontain' class='uzsuEvent' >" +
								"<select name='uzsuCondition" + numberOfRow + "' id='uzsuConditionType" + numberOfRow + "' data-mini='true'>" +
									"<option value='='>=</option>" +
									"<option value='<'><</option>" +
									"<option value='>'>></option>" +
									"<option value='>='>>=</option>" +
									"<option value='<='><=</option>" +
									"<option value='!='>!=</option>" +
									"<option value='Perl'>Perl</option>" +
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
    			"<div class='uzsuCell'>" +
    				"<div class='uzsuCellText'>v4.3</div>" +
    				"<form>" +
    					"<fieldset data-mini='true'>" +
    						"<input type='checkbox' id='uzsuGeneralActive'>" +
    							"<label for='uzsuGeneralActive'>Active</label>" +
    					"</fieldset>" +
    				"</form>" +
    			"</div><div class='uzsuCell'>" +
    				"<div class='uzsuCellText'></div>" +
    					"<div data-role='controlgroup' data-type='horizontal' data-inline='true' data-mini='true'>" +
    						"<div data-role = 'button' id='uzsuAddTableRow'>New</div>" +
    						"<div data-role = 'button' id='uzsuSortTime'>Sort</div>" +
    					"</div>" +
    				"</div>" +
    			"<div class='uzsuCell'>" +
    				"<div class='uzsuCellText'></div>" +
    					"<div data-role='controlgroup' data-type='horizontal' data-inline='true' data-mini='true'>" +
    						"<div data-role = 'button' id='uzsuCancel'>Cancel</div>" +
    						"<div data-role = 'button' id='uzsuSaveQuit'>OK</div>" +
    					"</div>" +
    				"</div>" +
    			"</div>" +
    		"</div>";
	// und der Abschluss des uzsuClear als Rahmen für den float:left und des uzsuPopup divs
	tt += "</div></div>";
	return tt;
}
//----------------------------------------------------------------------------
// Funktionen für das dynamische Handling der Seiteninhalte des Popups
//----------------------------------------------------------------------------
// Expertenzeile mit Eingaben auf der Hauptzeile benutzbar machen oder sperren
function uzsuSetTextInputState(numberOfRow){
	// status der eingaben setzen, das brauchen wir an mehreren stellen
	if ($('#uzsuEvent' + numberOfRow).val() === 'time'){
		$('#uzsuTimeMin' + numberOfRow).textinput('disable');
		$('#uzsuTimeOffset' + numberOfRow).textinput('disable');
		$('#uzsuTimeMax' + numberOfRow).textinput('disable');
		// und den Zeit auf 00:00 stellen wenn von sunrise auf time umgeschaltet wird
		if($('#uzsuTimeCron' + numberOfRow).length !== 0){
			$('#uzsuTimeCron' + numberOfRow).textinput('enable');
			// experten button abanfalls auf normal setzen
			$('#uzsuExpert' + numberOfRow).closest('div').removeClass('ui-checkbox-off');
			//
			if($('#uzsuTimeCron' + numberOfRow).val().indexOf('sun')===0)
				$('#uzsuTimeCron' + numberOfRow).val('00:00');
		}
	}
	else{
		$('#uzsuTimeMin' + numberOfRow).textinput('enable');
		$('#uzsuTimeOffset' + numberOfRow).textinput('enable');
		$('#uzsuTimeMax' + numberOfRow).textinput('enable');
		// und den Text event auf sunrise bzw. sunset setzen, damit man ihn erkennt !
		if($('#uzsuTimeCron' + numberOfRow).length !== 0){
			$('#uzsuTimeCron' + numberOfRow).textinput('disable');
			// experten button ebenfalls auf rot setzen
			$('#uzsuExpert' + numberOfRow).closest('div').addClass('ui-checkbox-on');
			$('#uzsuTimeCron' + numberOfRow).val($('#uzsuEvent' + numberOfRow).val());
		}
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
	    	$('#uzsuConditionDevicePerl'+numberOfRow).val(response.list[numberOfRow].condition.conditionDevicePerl);
	    	$('#uzsuConditionType'+numberOfRow).val(response.list[numberOfRow].condition.conditionType);
	    	$('#uzsuConditionType'+numberOfRow).selectmenu('refresh', true);
	    	$('#uzsuConditionValue'+numberOfRow).val(response.list[numberOfRow].condition.conditionValue);
	    	$('#uzsuConditionActive'+numberOfRow).prop('checked',response.list[numberOfRow].condition.conditionActive).checkboxradio("refresh");
			// experten button ebenfalls auf rot setzen
			$('#uzsuExpert' + numberOfRow).closest('div').addClass('ui-checkbox-on');
	    }
		//$('#uzsuTime' + numberOfRow).val(response.list[numberOfRow].time);
	    $('#uzsuTimeMin'+numberOfRow).val(response.list[numberOfRow].timeMin);
	    $('#uzsuTimeOffset'+numberOfRow).val(parseInt(response.list[numberOfRow].timeOffset));
	    $('#uzsuTimeMax'+numberOfRow).val(response.list[numberOfRow].timeMax);
	    $('#uzsuTimeCron'+numberOfRow).val(response.list[numberOfRow].timeCron);
	    // und die pull down Menüs richtig, damit die Einträge wieder stimmen
	    $('#uzsuEvent'+numberOfRow).val(response.list[numberOfRow].event).attr('selected',true).siblings('option').removeAttr('selected');
	    // und der Refresh, damit es angezeigt wird
		$('#uzsuEvent'+numberOfRow).selectmenu('refresh', true);
		// Fallunterscheidung für den Expertenmodus
		uzsuSetTextInputState(numberOfRow);
		if((designType === '0') || (designType === '2')){
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
		}
		else{
			// wenn designType = 1, dann einfach nur den String
			$('#uzsuRrule' + numberOfRow).val(response.list[numberOfRow].rrule);
		}
		// jetzt die holiday themem für fhem
		if(designType === '2'){
			$('#holidayWork' + numberOfRow).prop('checked', response.list[numberOfRow].holiday.Work).checkboxradio("refresh");			
			$('#holidayWeekend' + numberOfRow).prop('checked', response.list[numberOfRow].holiday.Weekend).checkboxradio("refresh");			
		}
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
			response.list[numberOfRow].condition.conditionDevicePerl = $('#uzsuConditionDevicePerl'+numberOfRow).val();
			response.list[numberOfRow].condition.conditionType = $('#uzsuConditionType'+numberOfRow).val();
			response.list[numberOfRow].condition.conditionValue = $('#uzsuConditionValue'+numberOfRow).val();
			response.list[numberOfRow].condition.conditionActive = $('#uzsuConditionActive'+numberOfRow).is(':checked');
		}
		//response.list[numberOfRow].time = $('#uzsuTime'+numberOfRow).val();
		response.list[numberOfRow].timeMin = $('#uzsuTimeMin'+numberOfRow).val();
		response.list[numberOfRow].timeOffset = $('#uzsuTimeOffset'+numberOfRow).val();
		response.list[numberOfRow].timeMax = $('#uzsuTimeMax'+numberOfRow).val();
		response.list[numberOfRow].timeCron = $('#uzsuTimeCron'+numberOfRow).val();
		response.list[numberOfRow].event = $('#uzsuEvent'+numberOfRow).val();
	    if((designType === '0') || (designType === '2')){
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
		}
		else{
			// hier wird der String direkt übergeben
			response.list[numberOfRow].rrule = $('#uzsuRrule' + numberOfRow).val();
		}
		// jetzt die holiday themem für fhem
		if(designType === '2'){
			response.list[numberOfRow].holiday.Work = $('#holidayWork' + numberOfRow).is(':checked');
			response.list[numberOfRow].holiday.Weekend = $('#holidayWeekend' + numberOfRow).is(':checked');
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
	response.list.push({active:false,rrule:'',time:'00:00',value:0,event:'time',timeMin:'',timeMax:'',timeCron:'00:00',timeOffset:'',condition:{conditionDevicePerl:'',conditionType:'Perl',conditionValue:'',conditionActive:false},holiday:{work:false,weekend:false}});
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
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuNumberOfRow' + (numberOfEntries - 1)).remove();
		// und Daten wieder ausfüllen
		uzsuFillTable(response, designType, valueType, valueParameterList);
	}
}

function uzsuShowExpertLine(e) {
	// Tabellezeile ermitteln, wo augerufen wurde. es ist die 10. Stelle des aufrufenden Objektes
	var numberOfRow = parseInt(e.currentTarget.id.substr(10));
	// erst einmal alle verschwinden lassen
	uzsuHideAllExpertLines();
	// Zeile anzeigen
	$('#uzsuExpertLine'+numberOfRow).css('display','');
	// Zeile für conditions anzeigen, wenn sie existieren
	if($('#uzsuConditionLine'+numberOfRow).length){
		$('#uzsuConditionLine'+numberOfRow).css('display','');		
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
	// Handler, um je nach Event die inputs zu Aktivieren / Deaktivieren reagiert auf die Änderung des Pulldown Menüs
	$.mobile.activePage.find('#uzsuEvent' + numberOfRow).on('change', function (){
		uzsuSetTextInputState(numberOfRow);
	});
}

function uzsuHideExpertLine(e) {
	// Tabellezeile ermitteln, wo aufgerufen wurde. es ist die 10. Stelle des aufrufenden Objektes
	var numberOfRow = parseInt(e.currentTarget.id.substr(10));
	// tabellenzeile löschen
	if ($('#uzsuExpertLine'+numberOfRow)) {
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuExpertLine'+numberOfRow).css('display','none');
		// auch für die Conditions
		if($('#uzsuConditionLine'+numberOfRow).length){
			$('#uzsuConditionLine'+numberOfRow).css('display','none');		
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
		// auch für die Conditions
		if($('#uzsuConditionLine'+numberOfRow).length){
			$('#uzsuConditionLine'+numberOfRow).css('display','none');		
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
		alert('DOM Daten für UZSU nicht vorhanden! Item falsch konfiguriert oder nicht vorhanden ! (update-event)');
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
		alert('DOM Daten für UZSU nicht vorhanden! Item falsch konfiguriert oder nicht vorhanden ! (click-event)');
	}
	else{
		// jetzt erweitern wir die dicts pro Eintrag, um dem dort einhaltenen Timestring die enthaltenen Einzelteile zu bekommen
		uzsuExpandTimestring(response);
	 	// Auswertung der Übergabeparameter
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
		// data-item ist der sh.py item, in dem alle Attribute lagern, die für die Steuerung notwendig ist ist ja vom typ dict. das item, was tatsächlich per
		// Schaltuhr verwendet wird ist nur als attribut (child) enthalten und wird ausschliesslich vom Plugin verwendet. wird für das rückschreiben der Daten an smarthome.py benötigt
		var item = $(this).attr('data-item');
		// jetzt kommt noch die Liste von Prüfungen, damit hinterher keine Fehler passieren, zunächst fehlerhafter designType (unbekannt)
		if ((designType !== '0') && (designType !== '1') && (designType !== '2')) {
			alert('Fehlerhafter Parameter: "' + designType + '" im Feld designType bei Item ' + item);
			popupOk = false;
		}
		// fehlerhafter valueType (unbekannt)
		if ((valueType !== 'bool') && (valueType !== 'num')	&& (valueType !== 'text') && (valueType !== 'list')) {
			alert('Fehlerhafter Parameter: "' + valueType + '" im Feld valueType bei Item ' + item);
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
			for (var numberOfRow = 0; numberOfRow < response.list.length; numberOfRow++) {
				// test, ob die einträge für conditions vorhanden sind
				if (response.list[numberOfRow].condition === undefined){
					response.list[numberOfRow].condition = {conditionDevicePerl:'',conditionType:'',conditionValue:'',conditionActive:false};
				}
				// test, ob die einträge für holiday gesetzt sind
				if (response.list[numberOfRow].holiday === undefined){
					response.list[numberOfRow].holiday = {work:false,weekend:false};
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
