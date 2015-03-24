// 
// Neugestaltetes UZSU Widget zur Bedienung UZSU Plugin
//
// Release feature v2.8
//
// Darstellung der UZSU Einträge und Darstellung Widget in Form eine Liste mit den Einträgen
// Umsetzung
// (c) Michael Würtenberger 2014,2015
// 
//  APL 2.0 Lizenz
//
// Basis der Idee des dynamischen Popups übernommen von John Chacko
// 		jQuery Mobile runtime popup
// 		16. November 2012 · 0 Comments	 
// 		http://johnchacko.net/?p=44
//
// und für die Anwendung in der smartvisu neu geschrieben.
//
// 
// set browser and platform identification variables
var browserIdentificationVariable = document.documentElement;
	browserIdentificationVariable.setAttribute('data-useragent',navigator.userAgent);
	browserIdentificationVariable.setAttribute('data-platform', navigator.platform);
	browserIdentificationVariable.className += ((!!('ontouchstart' in window) || !!('onmsgesturechange' in window)) ? ' touch' : '');

function uzsuCollapseTimestring(response, designType){
	for (numberOfEntry = 0; numberOfEntry < response.list.length; numberOfEntry++) {
		// zeitstring wieder zusammenbauen, falls Event <> 'time', damit wir den richtigen Zusammenbau im zeitstring haben
		timeString = '';
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
			// und den string setzen, bei designtype = 1 bleibt er bestehen, wird nicht geändert
			if(designType === '0'){
				response.list[numberOfEntry].time = timeString;
			}
		}
		// jetzt noch die zu vielen einträge aus dem dict löschen
		delete response.list[numberOfEntry].timeMin;
		delete response.list[numberOfEntry].timeMax;
		delete response.list[numberOfEntry].timeOffset;
		delete response.list[numberOfEntry].timeCron;
		delete response.list[numberOfEntry].event;
	}
}

function uzsuExpandTimestring(response){
	// ist aus dem uzsu plugin übernommen und nach js portiert
	for (numberOfEntry = 0; numberOfEntry < response.list.length; numberOfEntry++) {
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
	            if(event.indexOf('sunrise')===0) event = 'sunrise'; else event = 'sunset';
	        }
	    }
	    else if(tabsTime.length == 3){
	    	timeMin = tabsTime[0].trim();
	    	event = tabsTime[1].trim();
	    	timeMax = tabsTime[2].trim();
	        if(event.indexOf('sunrise')===0) event = 'sunrise'; else event = 'sunset';
	    }
	    else{
	    	// formatfehler ! ich nehme dann defaulteinstellung an
	    	timeMin = '';
	    	event = 'time';
	    	timeMax = '';
	    }
		timeOffset = '';
	    // nun noch der offset herausnehmen
	    tabsOffset = response.list[numberOfEntry].time.split('+');
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
	    // zuweisung der neuen werte im dict
		response.list[numberOfEntry].timeMin = timeMin;
		response.list[numberOfEntry].timeMax = timeMax;
		response.list[numberOfEntry].timeCron = timeCron;
		response.list[numberOfEntry].timeOffset = timeOffset;
		response.list[numberOfEntry].event = event;
		if(event != 'time') response.list[numberOfEntry].timeCron = event;
	}
}

function uzsuBuildTableHeader(headline, designType, valueType, valueParameterList) {
	// Kopf und überschrift des Popups
	var template = "";
	// hier kommt der popup container mit der beschreibung ein eigenschaften
	template += "<div data-role='popup' data-overlay-theme='b' data-theme='a' class='messagePopup' id='uzsuPopupContent' data-dismissible = 'false'>";
	// Schliessen Button rechts oben
	template += "<div data-rel='back' data-role='button' data-icon='delete' data-iconpos='notext' class='ui-btn-right' id='uzsuClose'></div>";
	// jetzt der inhalt geklammert mit span
	template += " <span> <div style='text-align:center'><h1>" + headline + "</h1></div>";
	// und dann der aufbau mit einer tabelle. Hier muss im 2. schritt dir formatierung über span laufen
	// um eine anpassung auf die aktuellen notation hinzubekommen. tabelle wird nicht ganz zukunftsweisend sein
	template += "<table id='uzsuTable' style = 'border: 1px solid;padding-right: 3px;padding-left: 3px'> ";
	// generell gibt es dann dispatcher für die einzelnen formate. ich fasse sie zusammen, wo immer es geht.
	// hier kann man auch die formate für sich selbst erweitern und anpassen.
	if(designType === '0'){
		// format 0 ist der default, macht wochentage, eine konfigurierbar eingabe des wertes und die aktivierungen
		template += "<tr><td>Value</td><td>Time</td><td>Weekdays</td><td>Active</td><td>Expert</td><td>Remove</td></tr>";
	}
	else{
		// format 1 ist der profimodus, hier kann man in einem textstring de facto alles auswerten
		template += "<tr><td>Value</td><td>Time (flex)<br>RRULE</td><td>Active</td><td>Remove</td></tr>";
	}
	return template;
}

function uzsuBuildTableRow(numberOfRow, designType, valueType, valueParameterList) {
	// Tabelleneinträge
	var template = "";
	// liste für die wochentage, damit ich später per index darauf zugreifen kann
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	template += "<tr id='uzsuNumberOfRow" + numberOfRow + "'>";
	// jetzt beginnen die spalten in der reihenfolge value, time / rrule, active, delete button mit flipswitch (bessere erkennbarkeit, die Texte können über das
	// widget gesetzt werden unterscheidung nur ob bool oder num, wobei num int ist !
	if (valueType == 'bool') {
		template += "<td><select name='UZSU' id='uzsuValue" + numberOfRow + "' data-role='slider' data-value = '1' data-mini='true'> <option value='0'>" + valueParameterList[1] + "</option> <option value='1'> "	+ valueParameterList[0] + " </option></select></td>";
	} 
	else if (valueType == 'num') {
		template += "<td><input type='number' " + valueParameterList[0] + " data-clear-btn='false' pattern='[0-9]*' style = 'width:40px' id='uzsuValue" + numberOfRow + "'</td>";
	} 
	else if (valueType == 'text') {
		template += "<td><input type='text' data-clear-btn='false' class='uzsuTextInput' style = 'width:60px' id='uzsuValue" + numberOfRow + "'</td>";
	} 
	else if (valueType == 'list') {
		// das listenformat mit select ist sehr trickreich. ich weiss nicht, wie ich automatisch die richtige höhe bekomme
		template += "<td><form><div data-role='fieldcontain' class='uzsuTextInput' style = 'width:120px; height:auto !important'>";
		template += "<select name='uzsuValue'" + numberOfRow + "' id='uzsuValue" + numberOfRow + "' data-mini='true'>";
		for (numberOfListEntry = 0; numberOfListEntry < valueParameterList.length; numberOfListEntry++) {
			// unterscheidung anzeige und werte
			if (valueParameterList[0].split(':')[1] === undefined) {
				template += "<option value='" + valueParameterList[numberOfListEntry].split(':')[0]	+ "'>"+ valueParameterList[numberOfListEntry].split(':')[0]	+ "</option>";
			} 
			else {
				template += "<option value='" + valueParameterList[numberOfListEntry].split(':')[1]	+ "'>"+ valueParameterList[numberOfListEntry].split(':')[0]	+ "</option>";
			}
		}
		template += "</select></div></form></td>";
	}
	// time
	if(designType === '0'){
		template += "<td><input type='time' data-clear-btn='false' style='width:40px' class='uzsuTimeInput' id='uzsuTimeCron" + numberOfRow + "'>";
		// rrule wurde auf die tage verteilt
		template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'>";
		for (numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
			template += "<input type='checkbox' id='checkbox" + numberOfDay	+ "-" + numberOfRow + "'> <label for='checkbox"	+ numberOfDay + "-" + numberOfRow + "'>" + weekDays[numberOfDay] + "</label>";
		}
		template += "</fieldset></form></td>";
	}
	else{
		// time
		template += "<td><input type='text' data-clear-btn='true' style = 'width:350px' id='uzsuTime" + numberOfRow + "'>";
		// rrule hier wird nur der textstring übernommen. prüfungen erfolgen keine !
		template += "<input type='text' data-clear-btn='true' style = 'width:350px' id='uzsuRrule"	+ numberOfRow + "'></td>";
	}
	// active schalter, die einzelne zeilen der schaltuhr aktivieren.
	template += "<td><form><fieldset data-role='controlgroup' data-type='horizontal' data-mini='true'> " + "<input type='checkbox' id='uzsuActive"	+ numberOfRow + "'> <label for='uzsuActive" + numberOfRow + "'>Act</label>" + "</fieldset></form></td>";
	if(designType === '0'){
		// expert button nur bei type = 0
		template += "<td> <button id='uzsuExpert" + numberOfRow + "' data-mini='true' data-icon='arrow-d' data-iconpos='notext'></button></td>";
	}
	// del button löschen eines zeileneintrags
	template += "<td> <button id='uzsuDelTableRow" + numberOfRow + "' data-mini='true'>Del</button></td>";
	// tabelle reihen abschliessen
	template += "</tr>";
	// und jetzt noch die unsichbare expertenzeile
	template += "<tr id='uzsuExpertLine" + numberOfRow + "' style='display:none;'><td colspan='6'><table>";
	// Tabellenüberschriften
	template += "<tr><td>earliest</td><td></td><td>Event</td><td>+/- min</td><td></td><td></td><td>latest</td></tr>";
	// tabellenfelder
	template += "<tr><td><input type='time' data-clear-btn='false' style='width:60px' class='uzsuTimeInput'id='uzsuTimeMin" + numberOfRow + "'</td>";
	template += "<td> <h1 style='margin:0'> < </h1> </td>";
	template += "<td><form><div data-role='fieldcontain' class='uzsuEvent' style = 'height:auto !important'>";
	template += "<select name='uzsuEvent" + numberOfRow + "' id='uzsuEvent" + numberOfRow + "' data-mini='true'>";
	template += "<option value='time'>Time</option>";
	template += "<option value='sunrise'>Sunrise</option>";
	template += "<option value='sunset'>Sunset</option>";
	template += "</div></form></td>";
	template += "<td><input type='number' data-clear-btn='false' style='width:40px' class='uzsuTimeInput' id='uzsuTimeOffset" + numberOfRow + "'</td>";
	template += "<td> Minutes</td><td> <h1 style='margin:0'> < </h1> </td>";
	template += "<td><input type='time' data-clear-btn='false' style='width:60px' class='uzsuTimeInput' id='uzsuTimeMax" + numberOfRow + "'</td>";
	template += "</tr>";
	// abschluss des Tabelleeintrags der expertenzeile
	template += "</table></td></tr>";

	return template;
}

function uzsuBuildTableFooter(designType) {
	// Anteil der Button zur steuerung des Popups
	var template = "";
	// tabelle der zeileneinträge abschliessen
	template += "</table>";
	// hier der activierungsbutton für die gesamte uzsu
	template += "<table style = 'border: 0'> <tr> <td> <form> <fieldset data-mini='true'> " + "<input type='checkbox' id='uzsuGeneralActive'> <label for='uzsuGeneralActive'>UZSU Activate</label>"	+ "</fieldset></form> </td>";
	// jetzt kommen noch die buttons in der basisleiste mit rein
	template += "<td> <div data-role='controlgroup' data-type='horizontal' data-inline='true' data-mini='true'>";
	template += "<div data-role = 'button' id = 'uzsuAddTableRow'> Add Entry </div>";
	template += "<div data-role = 'button' id = 'uzsuSaveQuit'> Save&Quit</div>";
	if (designType == '0') {
		template += "<div data-role = 'button' id = 'uzsuSortTime'> Sort Times</div>";
	}
	template += "<div data-role = 'button' id = 'uzsuCancel'> Cancel </div> </td>";
	template += "<td style = 'text-align: right'><h6> v2.8 feature </h6></td></div></tr></table>";
	// abschlus des gesamten span container
	template += "</span>";
	// und der abschluss des popup divs
	template += "</div>";
	return template;
}

function uzsuBuildTable(response, headline, designType, valueType,
		valueParameterList) {
	// hier wird das template zusammengestellt, die tabellenzeilen separat, weil ich die bei einer
	// ergänzung der tabelle wieder verwenden kann
	var template = "";
	var numberOfEntries = response.list.length;
	// erst den header, dann die zeilen, dann den footer
	template = uzsuBuildTableHeader(headline, designType, valueType,
			valueParameterList);
	for (numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
		template += uzsuBuildTableRow(numberOfRow, designType, valueType, valueParameterList);
	}
	template += uzsuBuildTableFooter(designType);
	return template;
}

function uzsuSetTextInputState(numberOfRow){
	// status der eingaben setzen
	// brauchen wir an mehrerer stellen
	if ($("#uzsuEvent"+numberOfRow).val() === 'time'){
		$('#uzsuTimeCron' + numberOfRow).textinput('enable');
		$('#uzsuTimeMin'+numberOfRow).textinput('disable');
		$('#uzsuTimeOffset'+numberOfRow).textinput('disable');
		$('#uzsuTimeMax'+numberOfRow).textinput('disable');
	}
	else{
		$('#uzsuTimeCron' + numberOfRow).textinput('disable');
		$('#uzsuTimeMin'+numberOfRow).textinput('enable');
		$('#uzsuTimeOffset'+numberOfRow).textinput('enable');
		$('#uzsuTimeMax'+numberOfRow).textinput('enable');
	}
}

function uzsuFillTable(response, designType, valueType, valueParameterList) {
	// tabelle füllen es werden die daten aus der variablen response gelesen und in den status
	// darstellung der widgetblöcke zugewiesen. der aktuelle status in dann in der darstellung enthalten !
	var numberOfEntries = response.list.length;
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	// jetzt wird die tabelle befüllt allgemeiner Status, bitte nicht mit attr, sondern mit prop, siehe
	// https://github.com/jquery/jquery-mobile/issues/5587
	$('#uzsuGeneralActive').prop('checked', response.active).checkboxradio("refresh");
	// dann die werte der tabelle
	for (numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
		// beim schreiben der Daten unterscheidung, da sonst das element falsch genutzt wird
		// mit flipswitch für die bool variante
		if (valueType == 'bool') {
			$('#uzsuValue' + numberOfRow).val(response.list[numberOfRow].value).slider("refresh");
		}
		// mit int value für die num variante
		else if ((valueType == 'num') || (valueType == 'text')) {
			$('#uzsuValue' + numberOfRow).val(response.list[numberOfRow].value);
		} 
		else if (valueType == 'list') {
			// hier ist es etwas schwieriger, denn ich muß den wert mit der liste vergleichen und dann setzen
			for (numberOfListEntry = 0; numberOfListEntry < valueParameterList.length; numberOfListEntry++) {
				// wenn ich den eintrag gefunden haben, dann setze ich den eintrag auf die richtige stelle
				// ansonsten wird einfach der erste eintrag genommen zusätzlich noch die unterscheidung, ob ich in der listen
				// anzeige und wertezuweisung trenne
				if (valueParameterList[0].split(':')[1] === undefined) {
					if (response.list[numberOfRow].value == valueParameterList[numberOfListEntry].split(':')[0]) {
						$("#uzsuValue" + numberOfRow).val(valueParameterList[numberOfListEntry].split(':')[0]).attr('selected',true).siblings('option').removeAttr('selected');
						$("#uzsuValue" + numberOfRow).selectmenu('refresh', true);
					}
				} 
				else {
					if (response.list[numberOfRow].value == valueParameterList[numberOfListEntry].split(':')[1]) {
						$("#uzsuValue" + numberOfRow).val(valueParameterList[numberOfListEntry].split(':')[1]).attr('selected',true).siblings('option').removeAttr('selected');
						$("#uzsuValue" + numberOfRow).selectmenu('refresh', true);
					}
				}
			}
		}
		// Values in der Zeile setzen
		$('#uzsuActive' + numberOfRow).prop('checked',response.list[numberOfRow].active).checkboxradio("refresh");
		$('#uzsuTime' + numberOfRow).val(response.list[numberOfRow].time);
	    $('#uzsuTimeMin'+numberOfRow).val(response.list[numberOfRow].timeMin);
	    $('#uzsuTimeOffset'+numberOfRow).val(parseInt(response.list[numberOfRow].timeOffset));
	    $('#uzsuTimeMax'+numberOfRow).val(response.list[numberOfRow].timeMax);
	    $('#uzsuTimeCron'+numberOfRow).val(response.list[numberOfRow].timeCron);
	    // und die pull down menüs richtig, damit die einträge wieder stimmen
	    $('#uzsuEvent'+numberOfRow).val(response.list[numberOfRow].event).attr('selected',true).siblings('option').removeAttr('selected');
	    // und der refresh, damit es angezeigt wird
		$('#uzsuEvent'+numberOfRow).selectmenu('refresh', true);
		// fallunterscheidung für den expertenmodus
		uzsuSetTextInputState(numberOfRow);
		if(designType === '0'){
			// in der tabelle die werte der rrule, dabei gehe ich von dem standardformat FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU
			// aus und setze für jeden eintrag den button.
			var rrule = response.list[numberOfRow].rrule;
			if (typeof rrule == "undefined") {
				rrule = '';
			}
			var ind = rrule.indexOf('BYDAY');
			// wenn der standard drin ist
			if (ind > 0) {
				var days = rrule.substring(ind);
				// Setzen der werte
				for (numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
					$('#checkbox' + numberOfDay + '-' + numberOfRow).prop('checked', days.indexOf(weekDays[numberOfDay]) > 0).checkboxradio("refresh");
				}
			}
		}
		else{
			// wenn experte, dann einfach nur den string
			$('#uzsuRrule' + numberOfRow).val(response.list[numberOfRow].rrule);
		}
	}
}

function uzsuSaveTable(item, response, designType, valueType, valueParameterList,
		saveSmarthome) {
	// tabelle auslesen und speichern
	var numberOfEntries = response.list.length;
	var weekDays = [ 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU' ];
	// hier werden die daten aus der tabelle wieder in die items im backend zurückgespielt
	// bitte darauf achten, dass das zurückspielen exakt dem der anzeige enspricht.
	// gesamthafte aktivierung
	response.active = $('#uzsuGeneralActive').is(':checked');
	// einzeleinträge
	for (numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
		// beim zurücklesen keine beachtung des typs, da smarthome bei bool auch 0 bzw. 1 akzeptiert
		if ((valueType == 'text') || (valueType == 'list')) {
			response.list[numberOfRow].value = $('#uzsuValue' + numberOfRow).val();
		} 
		else {
			response.list[numberOfRow].value = parseInt($('#uzsuValue' + numberOfRow).val());
		}
		// Values aus der Zeile auslesen
		response.list[numberOfRow].active = $('#uzsuActive' + numberOfRow).is(':checked');
		response.list[numberOfRow].time = $('#uzsuTimeCron' + numberOfRow).val();
		response.list[numberOfRow].timeMin = $('#uzsuTimeMin'+numberOfRow).val();
		response.list[numberOfRow].timeOffset = $('#uzsuTimeOffset'+numberOfRow).val();
		response.list[numberOfRow].timeMax = $('#uzsuTimeMax'+numberOfRow).val();
		response.list[numberOfRow].timeCron = $('#uzsuTimeCron'+numberOfRow).val();
		response.list[numberOfRow].event = $('#uzsuEvent'+numberOfRow).val();
	    if(designType === '0'){
			// in der tabelle die werte der rrule, dabei gehe ich von dem standardformat FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU
			// aus und setze für jeden eintrag den button. Setzen der werte.
			var first = true;
			var rrule = '';
			for (numberOfDay = 0; numberOfDay < 7; numberOfDay++) {
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
			// hier wird der string direkt übergeben
			response.list[numberOfRow].rrule = $('#uzsuRrule' + numberOfRow).val();
		}
	}
	// über json interface / treiber herausschreiben
	if (saveSmarthome) {
		uzsuCollapseTimestring(response, designType);
		io.write(item, {active : response.active,list : response.list});
	}
}

function uzsuAddTableRow(response, designType, valueType, valueParameterList) {
	// tabellenzeile einfügen
	var numberOfNewRow = response.list.length;
	var template = '';
	// alten zustand mal in die Liste rein. da der aktuelle zustand ja nur im widget selbst enthalten ist,
	// wird er vor dem umbau wieder in die variable response zurückgespeichert.
	uzsuSaveTable(1, response, designType, valueType, valueParameterList, false);
	// ich hänge immer an die letzte Zeile dran ! erst einmal das array erweitern
	response.list.push({active:false,rrule:'',time:'00:00',value:0,event:'time',timeMin:'',timeMax:'',timeCron:'00:00',timeOffset:''});
	// dann eine neue HTML Zeile genenrieren
	template = uzsuBuildTableRow(numberOfNewRow, designType, valueType,	valueParameterList);
	// zeile in die Tabelle einbauen
	$('#uzsuTable').append(template);
	// hier wichtig: damit die optimierung jquerymobile auf tabelle wirkt
	$.mobile.activePage.trigger('pagecreate');
	// den delete handler für die neue Zeile einhängen
	$.mobile.activePage.find("#uzsuDelTableRow" + numberOfNewRow).bind("tap",function(e) {
		uzsuDelTableRow(response, designType, valueType,valueParameterList, e);
	});
	// den helper handler für die neue Zeile einhängen
	$.mobile.activePage.find("#uzsuExpert"+ numberOfNewRow).bind("tap", function(e) {
		uzsuShowExpertLine(e);
	});	
	// und daten ausfüllen. hier werdne die zeile wieder mit dem status beschrieben. status ist dann wieder im widget
	uzsuFillTable(response, designType, valueType, valueParameterList);
}

function uzsuDelTableRow(response, designType, valueType, valueParameterList, e) {
	// tabellenzeile löschen
	var numberOfEntries = response.list.length;
	// wenn überhaupt einträge vorhanden sind sollte nicht passieren, weil eigentlich auch kein button dann da ist, aber...
	if (numberOfEntries > 0) {
		// index heraussuchen, in welcher Zeile gelöscht wurde
		var numberOfRowToDelete = parseInt(e.currentTarget.id.substr(15));
		// zwischenspeichern vor dem löschen
		uzsuSaveTable(1, response, designType, valueType, valueParameterList, false);
		// erst mal das array entsprechen kürzen
		response.list.splice(numberOfRowToDelete, 1);
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuNumberOfRow' + (numberOfEntries - 1)).remove();
		// und daten wieder ausfüllen
		uzsuFillTable(response, designType, valueType, valueParameterList);
	}
}

function uzsuSortFunction(a, b) {
	// sort funktion, wirklich vereinfacht für den speziellen fall
	return (a.time.replace(':', '') - b.time.replace(':', ''));
}

function uzsuSortTime(response, designType, valueType, valueParameterList, e) {
	// liets erst aus dem widget zurücklesen
	uzsuSaveTable(1, response, designType, valueType, valueParameterList, false);
	// sortieren der listeneinträge nach zeit
	response.list.sort(uzsuSortFunction);
	// jetzt noch die einträge wieder schreiben
	uzsuFillTable(response, designType, valueType, valueParameterList);
}

function uzsuShowExpertLine(e) {
	// tabellezeile ermitteln, wo augerufen wurde. es ist die 10. Stelle des aufrufenden objektes
	var numberOfRow = parseInt(e.currentTarget.id.substr(10));
	/// zeile anzeigen
	$('#uzsuExpertLine'+numberOfRow).css('display','');
	// jetzt noch den Button in der Zeile drüber auf arrow up ändern
	$("#uzsuExpert"+ numberOfRow).buttonMarkup({ icon: "arrow-u" });
	// und den callback ändern
	$.mobile.activePage.find("#uzsuExpert"+ numberOfRow).unbind("tap");
	$.mobile.activePage.find("#uzsuExpert"+ numberOfRow).bind("tap", function(e) {
		// propagation stoppen, sonst wird die zeile gleich wieder aufgemacht
		e.stopImmediatePropagation();
		uzsuHideExpertLine(e);
	});
	// handler, um je nach event die inputs zu aktivieren / deaktiovieren
	// reagiert auf die änderung des pulldown menüs
	$.mobile.activePage.find("#uzsuEvent"+numberOfRow).on('change', function (){
		uzsuSetTextInputState(numberOfRow);
	});
}

function uzsuHideExpertLine(e) {
	// tabellezeile ermitteln, wo augerufen wurde. es ist die 10. Stelle des aufrufenden objektes
	var numberOfRow = parseInt(e.currentTarget.id.substr(10));
	// tabellenzeile löschen
	if ($('#uzsuExpertLine'+numberOfRow)) {
		// jetzt die Tabelle kürzen im Popup
		$('#uzsuExpertLine'+numberOfRow).css('display','none');
		// jetzt noch den Button in der Zeile drüber ändern auf arrow down
		$("#uzsuExpert"+ numberOfRow).buttonMarkup({ icon: "arrow-d" });
		// und den callback ändern
		$.mobile.activePage.find("#uzsuExpert"+ numberOfRow).unbind("tap");
		$.mobile.activePage.find("#uzsuExpert"+ numberOfRow).bind("tap", function(e) {
			// propagation stoppen, sonst wird die zeile gleich wieder aufgemacht
			e.stopImmediatePropagation();
			uzsuShowExpertLine(e);
		});
	}
}

function runtimeUzsuPopup(response, headline, designType, valueType,
		valueParameterList, item) {
	// steuerung des Popups
	// erst einmal wird der leeranteil angelegt
	var template = uzsuBuildTable(response, headline, designType, valueType,
			valueParameterList);
	// dann speichern wir uns für cancel die ursprünglichen werte ab
	var responseCancel = jQuery.extend(true, {}, response);
	// dann hängen wir das an die aktuelle Seite
	$.mobile.activePage.append(template).trigger("pagecreate");
	// dann die werte eintragen.
	uzsuFillTable(response, designType, valueType, valueParameterList);
	// Popup schliessen mit close rechts oben in der box
	$.mobile.activePage.find("#uzsuClose").bind("tap", function(e) {
		// wenn keine Änderungen gemacht werden sollen (cancel), dann auch im
		// cache die alten werte
		$.mobile.activePage.find("#uzsuPopupContent").popup("close");
	});
	// Popup schliessen mit Cancel in der Leiste
	$.mobile.activePage.find("#uzsuCancel").bind("tap", function(e) {
		// wenn keine Änderungen gemacht werden sollen (cancel), dann auch im
		// cache die alten werte
		$.mobile.activePage.find("#uzsuPopupContent").popup("close");
	});
	// speichern mit SaveQuit
	$.mobile.activePage.find("#uzsuSaveQuit").bind("tap", function(e) {
		// jetzt wird die Kopie auf das original kopiert
		// und geschlossen
		uzsuSaveTable(item, response, designType, valueType, valueParameterList, true);
		$.mobile.activePage.find("#uzsuPopupContent").popup("close");
	});
	// eintrag hinzufügen mit add
	$.mobile.activePage.find("#uzsuAddTableRow").bind("tap", function(e) {
		uzsuAddTableRow(response, designType, valueType, valueParameterList);
	});
	// eintrag sortieren nach zeit
	$.mobile.activePage.find("#uzsuSortTime").bind("tap", function(e) {
		uzsuSortTime(response, designType, valueType, valueParameterList);
	});
	// löschen mit del als callback eintragen
	for (var numberOfRow = 0; numberOfRow < response.list.length; numberOfRow++) {
		$.mobile.activePage.find("#uzsuDelTableRow" + numberOfRow).bind("tap",function(e) {
			uzsuDelTableRow(response, designType, valueType, valueParameterList, e);
		});
		// call expert mode
		$.mobile.activePage.find("#uzsuExpert"+ numberOfRow).bind("tap", function(e) {
			uzsuShowExpertLine(e);
		});
	}
	// hier wir die aktuelle seite danach durchsucht, wo das popup ist und im folgenden das popup initialisiert, geöffnet und die schliessen
	// funktion daran gebunden. diese entfern wieder das popup aus dem baum
	$.mobile.activePage.find("#uzsuPopupContent").popup("open").bind({
		popupafterclose: function () {
			$(this).remove();
		}
	});
}

$(document).on("update",'[data-widget="uzsu.uzsu_icon"]',function(event, response) {
			// initialisierung zunächst wird festgestellt, ob Item mit Eigenschaft vorhanden. Wenn nicht: active = false
			// ansonsten ist der Status von active gleich dem gesetzten Status
			var active = response.length > 0 ? response[0].active : false;
			// Das Icon wird aktiviert, falls Status auf aktiv, ansonsten deaktiviert angezeigt
			$('#' + this.id + ' img').attr('src',(active ? $(this).attr('data-pic-on') : $(this).attr('data-pic-off')));
			// wenn keine Daten vorhanden, dann ist kein item mit den eigenschaften hinterlegt und es wird nichts gemacht
			if (response.length === 0)
				return;
			// Wenn ein Update erfolgt, dann werden die Daten erneut in die Variable uzsu geladen damit sind die UZSU objekte auch in der click funktion verfügbar
			if (response[0].list instanceof Array) {
				$(this).data('uzsu', response[0]);
			} 
			else {$(this).data('uzsu', {active : true,list : []	});
			}
		});

$(document).on("click",'[data-widget="uzsu.uzsu_icon"]',function(event) {
	// hier werden die parameter aus den attributen herausgenommen und beim öffnen mit .open(....) an das popup objekt übergeben
	// und zwar mit deep copy, damit ich bei cancel die ursprünglichen werte nicht überschrieben habe
	var response = jQuery.extend(true, {}, $(this).data('uzsu'));
	// jetzt erweitern wir die dicts pro eintrag, um nemen dem dort einhaltenen timestring die enthaltenen einzelteile zu bekommen
	uzsuExpandTimestring(response);
 	// auswertung der übergabeparameter
	var headline = $(this).attr('data-headline');
	var designType = $(this).attr('data-designType');
	var valueType = $(this).attr('data-valueType');
	// hier wird die komplette liste übergeben. widget.explode kehrt das implode au der webseite wieder um
	var valueParameterList = widget.explode($(this).attr('data-valueParameterList'));
	// default werte setzen fuer valueParameterList
	if(valueParameterList === undefined){
		if(valueType === 'bool') valueParameterList = ['On','Off'];
		else if (valueType === 'num') valueParameterList = ["step = '1'"];
		else if (valueType === 'text') valueParameterList = [''];
		else if (valueType === 'list') valueParameterList = ['Deault','0'];
	}
	// data-item ist der sh.py item, in dem alle attribute lagern, die für die steuerung notwendig ist ist ja vom typ dict. das item, was tatsächlich per
	// schaltuhr verwendet wird ist nur als attribut (child) enthalten und wird ausschliesslich vom plugin verwendet. wird für das rückschreiben der Daten an smarthome.py benötigt
	var item = $(this).attr('data-item');
	// jetzt kommt noch die liste von prüfungen, damit hinterher keine fehler passieren zunächst erst einmal popup wird angezeigt
	var popupOk = true;
	// fehlerhafter designType (unbekannt)
	if ((designType !== '0') && (designType !== '1')) {
		alert('Fehlerhafter Parameter: "' + designType + '" im Feld designType bei Item ' + item);
		popupOk = false;
	}
	// fehlerhafter valueType (unbekannt)
	if ((valueType !== 'bool') && (valueType !== 'num')	&& (valueType !== 'text') && (valueType !== 'list')) {
		alert('Fehlerhafter Parameter: "' + valueType + '" im Feld valueType bei Item ' + item);
		popupOk = false;
	}
	// bei designType '0' wird rrule nach wochentagen umgewandelt und ein festes format vogegegeben hier sollte nichts versehentlich überschrieben werden
	if (designType == '0') {
		numberOfEntries = response.list.length;
		for (var numberOfRow = 0; numberOfRow < numberOfEntries; numberOfRow++) {
			// test, ob die RRULE fehlerhaft ist
			if ((response.list[numberOfRow].rrule.indexOf('FREQ=WEEKLY;BYDAY=') !== 0) && (response.list[numberOfRow].rrule.length > 0)) {
				if (!confirm('Fehler: Parameter designType ist "0", aber gespeicherte RRULE String in UZSU "' + response.list[numberOfRow].rrule + '" entspricht nicht default Format FREQ=WEEKLY;BYDAY=MO... bei Item ' + item	+ '. Soll dieser Eintrag überschrieben werden ?')) {
					// direkter abbruch bei der entscheidung !
					numberOfRow = numberOfEntries;
					popupOk = false; 
				}
			}
		}
	}
	// wenn bei designType = 'list' ein split angegeben wird, dann muss er immer angegeben sein
	if ((valueType == 'list') && !(valueParameterList[0].split(':')[1] === undefined)) {
		for (var numberOfTextEntries = 0; numberOfTextEntries < valueParameterList.length; numberOfTextEntries++) {
			if (valueParameterList[numberOfTextEntries].split(':')[1] === undefined) {
				alert('Fehlerhafte Einträge im Parameter valueParameterList !');
				popupOk = false;
			}
		}
	}
	if (popupOk) {
		// öffnen des popups bei clicken des icons und ausführung der eingabefunktion
		runtimeUzsuPopup(response, headline, designType, valueType, valueParameterList, item);
	}
});
