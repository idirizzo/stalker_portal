//тут будут жизенно необходимые функции и переменные

var STB_EMULATION = false,
	debug = true,						   //вывод в консоль
	keyEnabled = 0,						 //переменная для блокировки пульта
	stb,
	curLangIdx,							 //текущий язык (пока не используеться)
	win = {
		"width" : 0,
		"height": 0
	},
	back = '',
	albumsAtLine = 4,					   //максимум альбомов в линию
	maxPictureLines = 2,					//картинок в столбце
	maxPictureColum = 4,					//картинок в строке
	pictureLinks = [],			 //ссылки на сами большые картинки
	picturesLinks = [],			//пустая переменная
	result_albumPict = [],		 //пустая переменная
	result_albumsTags = [],		//тэги для каждого альбома по 4 на брата
	found_pictUris_fin = [],	   //массив имён картинок по которым далее будем получать полную картинку пример: 5560526195709097554 для http://picasaweb.google.com/userID/albumid#5560526195709097554
	found_pictSrc = [],			//массив ссылок на миниатюры
	found_albumsUrls = [],		 //массив ссылок на страницы с полноразмерными картинками
	tempPosition = [],			 //(x,y) координаты выделения(selection и selectionSearch) на странице картинок и результатов поиска
	// pages
	curPage = 0,			//текущая страница
	Main_page = 0,			//все возможные страницы
	Album_page = 1,
	Pictures_page = 2,
	SinglePicture_page = 3,
	Search_page = 5,
	Searched_pict = 6,
	alert = 7,

	curAlbumPage = 0,					  //текущая страница с альбомами
	curSelectedItem = 0,				   //индекс текущего выделеного альбома (0..albumsAtLine) на странице альбомов(ненужный дубль)
	curAlbumName = null,				   //пока пустая переменная
	curAlbumIdx = 0,					   //индекс текущего выделеного альбома (0..albumsAtLine) на странице альбомов
	albumCount = 0,						//кол-во альбомов - полученое аяксом и распарсеное число альбомов
	userId = 0,							//переменная в которой хранится имя(id) данного пользователя
	posPictSelector = [0, 0],			   //(x,y) координаты выделения(selection и selectionSearch) на странице картинок и результатов поиска
	tempAlbNo = 0,						 //индекс альбома который мы сейчас просматриваем
	tempPictNo = 0,						//индекс картинки на которой нажали ОК
	str = null,							//здесь хранится полученый аяксом текст
	curLink = null,						//здесь хранится полученый аяксом текст со ссылкой
	curPictPage = 0,					   //индекс текущей страницы картинок
	curAction = 0,						 //текущее действие(публ. галерея, поиск, аутентификация) на главной странице
	startEdit = 0,						 //в "1" если на главной странице какое то из текстовых полей активно
	searchResults = null,				  //массив "полезных" ссылок в поиске
	searchPage = 0,						//индекс страници с результатами поиска
	searchCount = 0,					   //количество найденого
	curPictS = 0,						  //номер искомой картинки на странице (от 0 до maxPictureLines*maxPictureColum - 1)
	slideshowType = 0,					 //тип слайдшоу 0 - по порядку, 1 - перемешать
	slDelayArr = [5000, 10000, 15000, 30000, 60000, 180000, 300000, 600000, 900000],	   //массив временных задержек в слайдшоу
	slideshowDelay = 0,				   //индекс массива временных задержек
	aspect = 0,
	recursStoper = 0,
	showInfo = 0,
	horShift = 0,
	verShift = 0,
	horShiftSear = 0,
	verShiftSear = 0,
	pictureAngle = 1,
	pictureSize = 0,
	pictureRealSize = {
		height: null,
		width : null
	},
	album = {
		names    : null,
		subs     : null,
		pictCount: null,
		pictures : null,
		id       : null,
		date     : null
	},
	picture = {
		names: null,
		subs : null,
		img  : null,
		src  : null
	},
	aspectInd = ['fit', 'widescreen', 'exp', 'big', 'decr'],
// stand by mode
	standBy = {
		hdmiEventDelay : Number(JSON.parse(gSTB.GetEnv(JSON.stringify({varList: ['hdmi_event_delay']}))).result.hdmi_event_delay),
		toggleMode     : function () {
			_debug('toogle');
			if ( gSTB.GetStandByStatus() ) {
				gSTB.SetLedIndicatorMode(2);
				gSTB.StandBy(false);
				//gSTB.Continue();
			} else {
				gSTB.Stop(); // pause video
				gSTB.SetLedIndicatorMode(1);
				gSTB.StandBy(true);
			}
		},
		standByOnTimer : 0,
		standByOffTimer: 0
	},
	stbEvent = {};

gSTB.InitPlayer();
stbEvent.onEvent = function ( e, info ) {
	e = parseInt(e);
	_debug(e, 'event:');
	_debug(info, 'event info:');
	switch ( e ) {
		case 32: // connect HDMI device
			clearTimeout(standBy.standByOnTimer);
			clearTimeout(standBy.standByOffTimer);
			if ( gSTB.GetStandByStatus() && standBy.hdmiEventDelay ) {
				standBy.standByOffTimer = setTimeout(function () {
					standBy.toggleMode();
				}, standBy.hdmiEventDelay * 1000);
			}
			break;
		case 33: // disconnect HDMI device
			clearTimeout(standBy.standByOnTimer);
			clearTimeout(standBy.standByOffTimer);
			if ( !gSTB.GetStandByStatus() && standBy.hdmiEventDelay ) {
				standBy.standByOnTimer = setTimeout(function () {
					standBy.toggleMode();
				}, standBy.hdmiEventDelay * 1000);
			}
			break;
	}
};


function continueLoad () {  //определение разрешения, а в последствии языка
	var graphicres_mode = '720',
		elem, i;

	win = {"width": screen.width, "height": screen.height};
	document.getElementById('loading').style.display = 'block';
	back = window.location.search.match(/\?referrer=.*/) || [];
	back = decodeURIComponent(back[0]);
	back = back.replace(/\?referrer=/, '');
	if ( !back || back == "null" ) {back = "file:///home/web/services.html";}

	switch ( win.height ) {
		case 480:
			graphicres_mode = "720";
			albumsAtLine = 4;					   //максимум альбомов в линию
			maxPictureLines = 2;					//картинок в столбце
			maxPictureColum = 4;					//картинок в строке
			create_pictForm();
			horShift = 144;
			verShift = 178;
			horShiftSear = 144;
			verShiftSear = 167;
			document.getElementById('tags_10').style.display = 'table-cell';
			document.getElementById('tags_11').style.display = 'table-cell';
			document.getElementById('tags_12').style.display = 'table-cell';
			document.getElementById('tags_13').style.display = 'table-cell';
			document.getElementById('tags_10').style.width = '140px';
			document.getElementById('tags_11').style.width = '140px';
			document.getElementById('tags_12').style.width = '140px';
			document.getElementById('tags_13').style.width = '140px';
			document.getElementById('tags_10').style.height = '124px';
			document.getElementById('tags_11').style.height = '124px';
			document.getElementById('tags_12').style.height = '124px';
			document.getElementById('tags_13').style.height = '124px';
			document.getElementById('tags_10').style.overflow = 'hidden';
			document.getElementById('tags_11').style.overflow = 'hidden';
			document.getElementById('tags_12').style.overflow = 'hidden';
			document.getElementById('tags_13').style.overflow = 'hidden';
			break;
		default:
			graphicres_mode = "720";
			albumsAtLine = 4;					   //максимум альбомов в линию
			maxPictureLines = 2;					//картинок в столбце
			maxPictureColum = 4;					//картинок в строке
			create_pictForm();
			horShift = 144;
			verShift = 178;
			horShiftSear = 144;
			verShiftSear = 197;
			document.getElementById('tags_10').style.display = 'table-cell';
			document.getElementById('tags_11').style.display = 'table-cell';
			document.getElementById('tags_12').style.display = 'table-cell';
			document.getElementById('tags_13').style.display = 'table-cell';
			document.getElementById('tags_10').style.width = '140px';
			document.getElementById('tags_11').style.width = '140px';
			document.getElementById('tags_12').style.width = '140px';
			document.getElementById('tags_13').style.width = '140px';
			document.getElementById('tags_10').style.height = '124px';
			document.getElementById('tags_11').style.height = '124px';
			document.getElementById('tags_12').style.height = '124px';
			document.getElementById('tags_13').style.height = '124px';
			document.getElementById('tags_10').style.overflow = 'hidden';
			document.getElementById('tags_11').style.overflow = 'hidden';
			document.getElementById('tags_12').style.overflow = 'hidden';
			document.getElementById('tags_13').style.overflow = 'hidden';
			break;
		case 720:
			graphicres_mode = "1280";
			albumsAtLine = 7;					   //максимум альбомов в линию
			maxPictureLines = 2;					//картинок в столбце
			maxPictureColum = 4;					//картинок в строке
			horShift = 269;
			verShift = 272;
			horShiftSear = 274;
			verShiftSear = 263;
			document.getElementById('tags_10').style.display = 'table-cell';
			document.getElementById('tags_11').style.display = 'table-cell';
			document.getElementById('tags_12').style.display = 'table-cell';
			document.getElementById('tags_13').style.display = 'table-cell';
			document.getElementById('tags_10').style.width = '140px';
			document.getElementById('tags_11').style.width = '140px';
			document.getElementById('tags_12').style.width = '140px';
			document.getElementById('tags_13').style.width = '140px';
			document.getElementById('tags_10').style.height = '186px';
			document.getElementById('tags_11').style.height = '186px';
			document.getElementById('tags_12').style.height = '186px';
			document.getElementById('tags_13').style.height = '186px';
			document.getElementById('tags_10').style.overflow = 'hidden';
			document.getElementById('tags_11').style.overflow = 'hidden';
			document.getElementById('tags_12').style.overflow = 'hidden';
			document.getElementById('tags_13').style.overflow = 'hidden';
			for ( i = 0; i < 3; i++ ) {
				_debug('current adding a_elem' + i);
				elem = document.createElement('div');
				elem.id = 'album_' + (i + 4);
				elem.className = 'pc_album_box';
				elem.innerHTML += '<div class="t17w box_date" id="tags_2' + (i + 4) + '"></div>';
				elem.innerHTML += '<div class="t17w box_qtyph" id="tags_3' + (i + 4) + '"></div>';
				elem.innerHTML += '<div class="pc_album_box_frame" id="picture_' + (i + 4) + '"></div>';
				elem.innerHTML += '<div class="t18w shadow_b bold" id="tags_0' + (i + 4) + '"style="width:120px;"></div>';
				elem.innerHTML += '<div class="t17w box_date"  id="tags_1' + (i + 4) + '" style="display: table-cell; width: 140px; height: 186px; -webkit-text-overflow:clip; overflow: hidden;">';
				document.getElementById('pc_main').appendChild(elem);
			}
			create_pictForm();
			break;
		case 1080:
			graphicres_mode = "1920";
			albumsAtLine = 7;					   //максимум альбомов в линию
			maxPictureLines = 2;					//картинок в столбце
			maxPictureColum = 4;					//картинок в строке
			horShift = 434;
			verShift = 410;
			horShiftSear = 439;
			verShiftSear = 419;
			document.getElementById('tags_10').style.display = 'table-cell';
			document.getElementById('tags_11').style.display = 'table-cell';
			document.getElementById('tags_12').style.display = 'table-cell';
			document.getElementById('tags_13').style.display = 'table-cell';
			document.getElementById('tags_10').style.width = '220px';
			document.getElementById('tags_11').style.width = '220px';
			document.getElementById('tags_12').style.width = '220px';
			document.getElementById('tags_13').style.width = '220px';
			document.getElementById('tags_10').style.height = '372px';
			document.getElementById('tags_11').style.height = '372px';
			document.getElementById('tags_12').style.height = '372px';
			document.getElementById('tags_13').style.height = '372px';
			document.getElementById('tags_10').style.overflow = 'hidden';
			document.getElementById('tags_11').style.overflow = 'hidden';
			document.getElementById('tags_12').style.overflow = 'hidden';
			document.getElementById('tags_13').style.overflow = 'hidden';
			document.getElementById('tags_00').style.width = '224px';
			document.getElementById('tags_01').style.width = '224px';
			document.getElementById('tags_02').style.width = '224px';
			document.getElementById('tags_03').style.width = '224px';
			document.getElementById('tags_00').style.display = 'block';
			document.getElementById('tags_01').style.display = 'block';
			document.getElementById('tags_02').style.display = 'block';
			document.getElementById('tags_03').style.display = 'block';
			for ( i = 0; i < 3; i++ ) {
				elem = document.createElement('div');
				elem.id = 'album_' + (i + 4);
				elem.className = 'pc_album_box';
				elem.innerHTML += '<div class="t17w box_date" id="tags_2' + (i + 4) + '"></div>';
				elem.innerHTML += '<div class="t17w box_qtyph" id="tags_3' + (i + 4) + '"></div>';
				elem.innerHTML += '<div class="pc_album_box_frame" id="picture_' + (i + 4) + '"></div>';
				elem.innerHTML += '<div class="t18w shadow_b bold" id="tags_0' + (i + 4) + '" style="display: block; width: 224px;max-width: 224px; -webkit-text-overflow:clip; overflow: hidden; "></div>';
				elem.innerHTML += '<div class="t17w box_date"  id="tags_1' + (i + 4) + '" style="display: table-cell; width: 220px; height: 372px; overflow: hidden;">';
				_debug('elem.innerHTML' + elem.innerHTML);
				document.getElementById('pc_main').appendChild(elem);
			}
			create_pictForm();
			break;
	}

	curLangIdx = getCurrentLanguage();
	loadStyle('css/style' + win.height + '.css');
	window.resizeTo(win.width, win.height);
	_debug('width' + win.width + 'height' + win.height);
	_debug('win.width= ' + win.width + ' win.height= ' + win.height + ' graphicres_mode= ' + graphicres_mode);
	keyEnabled = 1;

	try {
		loadScript('lang/' + curLangIdx + '.js');
	} catch ( e ) {
		console.log('wrong lang. changed to default');
		loadScript('lang/en.js');
	}

	setTimeout(function () {
		document.getElementById('blackScreen').style.zIndex = '-4';
		document.getElementById('loading').style.display = 'none';
		document.getElementById('blackScreen').style.display = 'none';
		document.getElementById('mainPage_holder_0').focus();
		document.getElementById('main_textU').innerHTML = main_gallery;
		document.getElementById('main_textS').innerHTML = main_search;
		document.getElementById('album_count').innerHTML = albums;
	}, 1000);
}

// Динамическая подгрузка файла CSS
// src = URL подгружаемого файла
function loadStyle ( src ) {
	var elem = document.createElement('link');
	elem.setAttribute('rel', 'stylesheet');
	elem.setAttribute('type', 'text/css');
	elem.setAttribute('href', src);
	document.getElementsByTagName('head')[0].appendChild(elem);
}

// Динамическая подгрузка файла скрипта
//   src = URL подгружаемого файла
//   onLoad = функция, вызываемая после его загрузки
function loadScript ( src, onLoad ) {
	var elem = document.createElement('script');
	elem.setAttribute('language', 'JavaScript');
	elem.setAttribute('src', src);
	if ( onLoad ) { elem.setAttribute('onLoad', onLoad); }
	document.getElementsByTagName('head')[0].appendChild(elem);
}

function getEnvironmentValue ( name ) { //получение переменной среды
	var value;
	if ( STB_EMULATION ) {
		try { value = eval('debug_' + name); } catch ( e ) {}
	} else {
		value = stb.RDir('getenv ' + name);
	}
	return value;
}

function _debug ( text ) {	//вывод в консоль
	if ( STB_EMULATION ) {
	} else {
		if ( debug ) { stb.Debug(text); }
	}
}

function lowCaser ( string ) {return string.substr(0).toLowerCase();}  //функция преобразования в нижний регистр

// Вычитываем из приставки значение переменной текущего языка
function getCurrentLanguage () {
	var lang = lowCaser(getEnvironmentValue('language'));// Читаем из среды окружения
	_debug('portal var lang = ' + lang);
	// Этот код является общим для всех html-страниц, поэтому я здесь вставил код формирования транспаранта EMULATION
	return lang;
}

function randomNumber ( m, n ) {						//генератор псевдослучайных чисел
	if ( !empty(m) ) {m = parseInt(m);}
	if ( !empty(n) ) {n = parseInt(n);}
	if ( !empty(m) && !empty(n) ) { return Math.floor(Math.random() * (n - m + 1)) + m; }
	if ( !empty(m) && empty(n) ) { return 0; }
	if ( empty(m) && !empty(n) ) { return Math.floor(Math.random() * (n + 1)); }
	if ( empty(m) && empty(n) ) { return Math.floor(Math.random()); }
}

function exitToMain () {		  //вызывается при выходе на главную страницу, обнуляет почти все переменные
	curSelectedItem = 0;
	curAlbumName = null;
	curAlbumIdx = 0;
	albumCount = 0;
	userId = 0;
	posPictSelector = [0, 0];
	tempAlbNo = 0;
	tempPictNo = 0;
	str = null;
	curLink = null;
	curPictPage = 0;
	curAlbumPage = 0;
	pictureLinks = [];
	picturesLinks = [];
	result_albumPict = [];
	result_albumsTags = [];
	found_pictUris_fin = [];
	found_pictSrc = [];
	found_albumsUrls = [];
	tempPosition = [];
	document.getElementById('pc_main').style.display = 'none';
	document.getElementById('pictures_form').style.display = 'none';
	document.getElementById('pictureBig_0').style.display = 'none';
	document.getElementById('pictureBig_0').innerHTML = '';
	document.getElementById('pictureBig_1').style.display = 'none';
	document.getElementById('search_form').style.display = 'none';
	document.getElementById('mainPage_holder_' + curAction).style.display = 'block';
	document.getElementById('mainPage_holder_' + curAction).disabled = '';
	window.setTimeout(function () {document.getElementById('mainPage_holder_' + curAction).focus();}, 100);
	document.getElementById('blackScreen').style.display = 'none';
	document.getElementById('owner').innerHTML = '';
	var div = document.getElementById('pageIndCont');
	div.innerHTML = '';
	curPage = Main_page;
	//curAction = 0;
	startEdit = 0;
	searchRes = null;
	searchPage = 0;
	slideshowType = 0;
	pictureRealSize.height = null;
	pictureRealSize.width = null;
	pictureAngle = 1;
	document.getElementById('selectionSearch').style.left = '78px';
	if ( win.height == 480 ) {
		document.getElementById('selectionSearch').style.top = '22px';
	} else {
		document.getElementById('selectionSearch').style.top = '48px';
	}
	album = {
		names    : null,
		subs     : null,
		pictCount: null,
		pictures : null,
		id       : null,
		date     : null
	};
	picture = {
		names: null,
		subs : null,
		img  : null,
		src  : null
	};
}

function create_pictForm () {
	var elem = document.createElement('div');
	elem.id = 'pictures_form';
	document.body.appendChild(elem);
	elem = document.createElement('div');
	switch ( win.height ) {
		case 480:
			elem.innerHTML += '<img id="selection" src="img/pc_item_2.png" style="width: 136px; height: 170px;  -webkit-border-radius: 8px; opacity:0.2; position: absolute; z-index: -1;margin-top: 29px;" alt=""/>';
			break;
		case 576:
			elem.innerHTML += '<img id="selection" src="img/pc_item_2.png" style="width: 136px; height: 175px;  -webkit-border-radius: 8px; opacity:0.2; position: absolute; z-index: -1;margin-top: 59px;" alt=""/>';
			break;
		case 720:
			elem.innerHTML += '<img id="selection" src="img/pc_item_2.png" style="width: 230px; height: 255px; -webkit-border-radius: 15px; opacity:0.2; position: absolute; z-index: -1;margin-top: 57px; margin-left: 16px;" alt=""/>';
			break;
		case 1080:
			elem.innerHTML += '<img id="selection" src="img/pc_item_2.png" style="width: 423px; height: 432px; -webkit-border-radius: 15px; opacity:0.2; position: absolute; z-index: -1;margin-top: 52px;" alt=""/>';
			break;
	}
	document.getElementById('pictures_form').appendChild(elem);
	var table = document.createElement('table');
	table.setAttribute("width", "580");
	table.setAttribute("height", "340");
	table.setAttribute("border", "0");
	table.style.position = 'absolute';
	switch ( win.height ) {
		case 480:
			table.style.marginLeft = '65px';
			table.style.marginTop = '85px';
			break;
		case 576:
			table.style.marginLeft = '65px';
			table.style.marginTop = '115px';
			break;
		case 720:
			table.style.marginLeft = '65px';
			table.style.marginTop = '105px';
			break;
		case 1080:
			table.style.marginLeft = '65px';
			table.style.marginTop = '105px';
			break;
	}
	table.style.zIndex = '10';
	var row = table.insertRow(0);
	var cell;
	for ( var i = 0; i < maxPictureColum; i++ ) {
		cell = row.insertCell(-1);
		cell.setAttribute('align', 'center');
		cell.setAttribute('valign', 'middle');
		switch ( win.width ) {
			case 720:
				cell.setAttribute('height', '120px');
				break;
			case 1280:
				cell.setAttribute('height', '216px');
				break;
			case 1920:
				cell.setAttribute('height', '370px');
				break;
		}
		cell.id = 'foto_0' + i;
	}
	row = table.insertRow(1);
	for ( var j = 0; j < maxPictureColum; j++ ) {
		cell = row.insertCell(-1);
		cell.setAttribute('align', 'center');
		cell.setAttribute('valign', 'middle');
		elem = document.createElement('div');
		elem.style.verticalAlign = 'middle';
		elem.style.paddingBottom = '35px';
		switch ( win.width ) {
			case 720:
				elem.style.width = '140px';
				break;
			case 1280:
				elem.style.width = '265px';
				break;
			case 1920:
				elem.style.width = '430px';
				break;
		}
		elem.style.lineHeight = '13px';
		elem.style.height = '13px';
		if ( win.width == 1920 ) {elem.style.fontSize = '24px';}
		elem.id = 'subscript_0' + j;
		cell.appendChild(elem);
	}
	row = table.insertRow(2);
	for ( var x = 0; x < maxPictureColum; x++ ) {
		cell = row.insertCell(-1);
		cell.setAttribute('align', 'center');
		cell.setAttribute('valign', 'middle');
		switch ( win.width ) {
			case 720:
				cell.setAttribute('height', '120px');
				break;
			case 1280:
				cell.setAttribute('height', '216px');
				break;
			case 1920:
				cell.setAttribute('height', '370px');
				break;
		}
		cell.id = 'foto_1' + x;
		_debug('x:' + x);
	}
	row = table.insertRow(3);
	for ( var y = 0; y < maxPictureColum; y++ ) {
		cell = row.insertCell(-1);
		cell.setAttribute('align', 'center');
		cell.setAttribute('valign', 'middle');
		elem = document.createElement('div');
		elem.style.verticalAlign = 'middle';
		elem.style.paddingBottom = '35px';
		switch ( win.width ) {
			case 720:
				elem.style.width = '140px';
				break;
			case 1280:
				elem.style.width = '265px';
				break;
			case 1920:
				elem.style.width = '430px';
				break;
		}
		elem.style.lineHeight = '13px';
		elem.style.height = '26px';
		if ( win.width == 1920 ) {elem.style.fontSize = '24px';}
		elem.id = 'subscript_1' + y;
		cell.appendChild(elem);
	}
	document.getElementById('pictures_form').appendChild(table);
}

function getXmlHttp () { //форма аякс запроса
	var request = new XMLHttpRequest();
	if ( request.overrideMimeType ) { request.overrideMimeType('text/html'); }
	return request;
}

//запрос для получения страницы пользователя
//запись в iframe и последующая обработка регулярными выражениями
//для получения альбомов этго пользователя
function getHtmlByUrl ( url ) {
	keyEnabled = 0;
	var req_done = false;
	try {
		try { netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect"); } catch ( e ) {}
		var request = getXmlHttp();
		request.open('GET', url, true);
		request.setRequestHeader("Content-Type", "text/xml");
		request.setRequestHeader("charset", "utf-8");
		request.onreadystatechange = function () {
			if ( request.readyState == 4 && request.status == 404 ) {
				//alert('wrong name or lost internet connection');
				document.getElementById('alertText').innerHTML = 'You enter wrong username';
				document.getElementById('alert').style.display = 'block';
				curPage = alert;
				return;
			}
			if ( request.readyState == 4 && request.status == 200 ) {
				req_done = true;
				var iframe = document.createElement('iframe');
				iframe.id = 'iframet';
				iframe.style.visibility = 'hidden';
				iframe.style.width = "0";
				iframe.style.height = "0";
				iframe.innerText = request.responseText;
				str = iframe.innerText;
				getOwner(str);  //yep
				albumCount = findAlbCount();	//yep
				pageMaker();	//yep
				findAlbDescr(str);
				fillPage(0);
				for ( var i = 0; i < (albumsAtLine); i++ ) { unselectItem(i); }
				curSelectedItem = selectItem(0, 0);

			}
			keyEnabled = 1;
		};
		request.send(null); // send object
	} catch ( e ) {}
}

function getOwner ( str ) {		 //имя владельца альбома
	var found = /"author":".*?"/.exec(str);
	found[0] = found[0].replace(/"author":"/, "");
	found[0] = found[0].replace(/"/, "");
	if ( !empty(found[0]) ) {
		document.getElementById('owner').innerHTML = 'Web-galery of user ' + found[0];
	} else {
		document.getElementById('owner').innerHTML = 'Web-galery of user ' + userId;
	}
}

function findAlbCount () {	//нахождение количества альбомов
	//str = '<meta name="title" content="Веб-галерея Picasa пользователя Dmitry Podyachev"/><meta name="description" content="Альбомов: 6"/><meta name="medium" content="image"/>'
	var re_pict = /"totalItems":.*?(?=,)/igm;
	var found = str.match(re_pict);
	re_pict = /"totalItems":/igm;
	found[0] = found[0].replace(re_pict, "");
	_debug(found[0]);
	return parseInt(found[0]);
}

function pageMaker () {	   //создание индикатора текущей и общего количества страниц
	var pages = albumCount / albumsAtLine,
		dcont, div;
	document.getElementById('pageIndCont').style.marginLeft = (win.width / 2) + 'px';
	for ( var i = 0; i < pages; i++ ) {
		_debug('document.getElementById("pageIndCont).style.marginLeft  ' + document.getElementById('pageIndCont').style.marginLeft);
		if ( (document.getElementById('pageIndCont').style.marginLeft.match(/\d*/)) > 13 ) {
			document.getElementById('pageIndCont').style.marginLeft = (document.getElementById('pageIndCont').style.marginLeft.match(/\d*/) - 13) + 'px';
		}
		dcont = document.getElementById('pageIndCont');
		div = document.createElement('div');
		div.setAttribute('id', 'pageInd_' + i);
		div.setAttribute('class', 'pc_pagecount_inact');
		dcont.appendChild(div);
	}
}

function drowFooter ( curPage ) {	   //проявление элементов футэра для определённой страницы
	switch ( curPage ) {
		case 0:
			document.getElementById('red').innerText = '';
			document.getElementById('green').innerText = '';
			document.getElementById('yellow').innerText = '';
			document.getElementById('blue').innerText = '';
			document.getElementById('footer').style.visibility = 'visible';
			document.getElementById('red_butt').style.visibility = 'hidden';
			document.getElementById('green_butt').style.visibility = 'hidden';
			document.getElementById('yellow_butt').style.visibility = 'hidden';
			break;
		case 1:
			document.getElementById('red').innerText = '';
			document.getElementById('green').innerText = '';
			document.getElementById('yellow').innerText = '';
			document.getElementById('blue').innerText = '';
			document.getElementById('red_butt').style.visibility = 'hidden';
			document.getElementById('green_butt').style.visibility = 'hidden';
			document.getElementById('yellow_butt').style.visibility = 'hidden';
			document.getElementById('blue_butt').style.visibility = 'hidden';
			document.getElementById('footer').style.visibility = 'visible';
			break;
		case 2:
			document.getElementById('red_butt').style.visibility = 'visible';
			document.getElementById('green_butt').style.visibility = 'visible';
			document.getElementById('yellow_butt').style.visibility = 'visible';
			document.getElementById('blue_butt').style.visibility = 'hidden';
			document.getElementById('red').innerText = slideshow;
			if ( slideshowDelay < 4 ) {
				document.getElementById('green').innerText = sl_delay + ' ' + (slDelayArr[slideshowDelay] / 1000) + ' ' + sec;
			} else {
				document.getElementById('green').innerText = sl_delay + ' ' + (slDelayArr[slideshowDelay] / 60000) + 'min';
			}
			switch ( win.width ) {
				case 1920:
					document.getElementById('yellow').innerHTML = '<img style="margin-left:15px; margin-top:-9px; width:40px; height:50px;" src="img/footer_menu_ico0_picasa.png" alt=""/>';
					break;
				default:
					document.getElementById('yellow').innerHTML = '<img style="margin-left:5px; margin-top:-7px;" src="img/footer_menu_ico0_picasa.png" alt=""/>';
					break;
			}
			document.getElementById('blue').innerText = '';
			document.getElementById('red').style.visibility = 'visible';
			document.getElementById('green').style.visibility = 'visible';
			document.getElementById('yellow').style.visibility = 'visible';
			document.getElementById('blue').style.visibility = 'visible';
			document.getElementById('footer').style.visibility = 'visible';
			break;
		case 3:
			document.getElementById('footer').style.visibility = 'hidden';
			break;
		case 4:
			document.getElementById('red').innerText = slideshow;
			if ( slideshowDelay < 4 ) {
				document.getElementById('green').innerText = sl_delay + ' ' + (slDelayArr[slideshowDelay] / 1000) + ' ' + sec;
			} else {
				document.getElementById('green').innerText = sl_delay + ' ' + (slDelayArr[slideshowDelay] / 60000) + 'min';
			}
			document.getElementById('yellow').innerHTML = '';
			//document.getElementById('blue').innerHTML = '';
			document.getElementById('red').style.visibility = 'visible';
			document.getElementById('green').style.visibility = 'visible';
			document.getElementById('yellow').style.visibility = 'hidden';
			document.getElementById('blue').style.visibility = 'visible';
			document.getElementById('red_butt').style.visibility = 'visible';
			document.getElementById('green_butt').style.visibility = 'visible';
			document.getElementById('yellow_butt').style.visibility = 'hidden';
			document.getElementById('blue_butt').style.visibility = 'hidden';
			document.getElementById('footer').style.visibility = 'visible';
			break;
		case 5:
			document.getElementById('red').innerText = '';
			document.getElementById('green').innerText = '';
			document.getElementById('yellow').innerText = '';
			document.getElementById('red').style.visibility = 'hidden';
			document.getElementById('green').style.visibility = 'hidden';
			document.getElementById('yellow').style.visibility = 'hidden';
			document.getElementById('blue').style.visibility = 'hidden';
			document.getElementById('red_butt').style.visibility = 'hidden';
			document.getElementById('green_butt').style.visibility = 'hidden';
			document.getElementById('yellow_butt').style.visibility = 'hidden';
			document.getElementById('blue_butt').style.visibility = 'hidden';
			document.getElementById('footer').style.visibility = 'hidden';
			break;
	}
}

function findAlbDescr ( str ) {	  //нахождение нахождение информации касательно альбома
	album.names = str.match(/\"title\"\:\".*?(?=\")/igm);
	album.subs = str.match(/\"description\"\:\".*?(?=\")/igm);
	album.pictCount = str.match(/\"numPhotos\"\:\d*?(?=\,)/igm);
	album.pictures = str.match(/\"thumbnails\"\:\[.*?(?=\"\])/igm);
	album.id = str.match(/\"id\"\:\".*?(?=\")/igm);
	album.date = str.match(/\"published\"\:\".{10}/igm);
	for ( var i = 0; i < albumCount; i++ ) {
		album.names[i] = album.names[i].replace(/"title":"/ig, "");
		if ( win.width == 1920 ) {
			album.names[i] = album.names[i].match(/.{1,18}/i)
		} else {
			album.names[i] = album.names[i].match(/.{1,12}/i)
		}
		album.subs[i] = album.subs[i].replace(/"description":"/ig, "");
		album.pictCount[i] = album.pictCount[i].replace(/"numPhotos":/ig, "");
		album.pictures[i] = album.pictures[i].replace(/"thumbnails":\["/ig, "");
		album.id[i] = album.id[i + 1].replace(/"id":"/ig, "");
		album.date[i] = album.date[i].replace(/"published":"/ig, "");
	}
}

function fillPage ( page ) {		//непосредственное заполнение страницы альбомов
	createPicture(albumsAtLine * (page));
	createTags(albumsAtLine * (page));
	curPage = Album_page;
	document.getElementById('album_count').innerText = albums + '(' + albumCount + ')';
	document.getElementById('pageInd_' + page).className = 'pc_pagecount_act';
	_debug('filing page complite curPage = ' + curPage);
	curAlbumPage = page;
}

function createPicture ( counter ) {  //  url - массив урл картинок может быть больше 3х || couneter - с какой картинки начинать отображение
	for ( var i = 0; i < (albumsAtLine); i++ ) {
		if ( (counter + i) < albumCount ) {
			_debug('counter+i' + counter + ' + ' + i + ' albumCount: ' + albumCount);
			switch ( win.width ) {
				default:
					document.getElementById('picture_' + i).innerHTML = '<img style="height:144px; width:144px;" src="' + album.pictures[i + counter] + '" alt="">';
					break;
				case 1920:
					document.getElementById('picture_' + i).innerHTML = '<img style="height:221px; width:221px;" src="' + album.pictures[i + counter] + '" alt="">';
					break;
			}
			document.getElementById('album_' + i).style.visibility = 'visible';
		} else {
			_debug('here');
			document.getElementById('album_' + i).style.visibility = 'hidden';
		}
	}
}

function createTags ( counter ) { //заполнение инфы об альбомах tagsUri - массив с инфой, counter - номер текущего альбома
	if ( counter < albumCount ) {
		for ( var i = 0; i < albumsAtLine; i++ ) {
			_debug(i);
			document.getElementById('tags_3' + i).innerText = album.pictCount[i + counter];
			document.getElementById('tags_2' + i).innerText = album.date[i + counter];
			document.getElementById('tags_0' + i).innerText = album.names[i + counter];
			document.getElementById('tags_1' + i).innerText = album.subs[i + counter];
		}
	}
}

function getData () {		 //функция генерации ссылки по которой будет послан запрос
	stb.HideVirtualKeyboard();
	userId = document.getElementById('mainPage_holder_0').value;
	getHtmlByUrl('http://picasaweb.google.com/data/feed/api/user/' + userId + '?kind=album&access=public&alt=jsonc&v=2');
}

function goInAlbum ( userId, albumId ) {	 //переход к конкретному альбому
	keyEnabled = 0;
	document.getElementById('pc_main').style.display = 'none';
	document.getElementById('pictures_form').style.position = 'inherit';
	document.getElementById('pictures_form').style.display = 'block';
	getPictures('http://picasaweb.google.com/data/feed/api/user/' + userId + '/albumid/' + albumId + '?kind=photo&access=public&alt=jsonc&v=2')
}

function backToAlbums () {				//возврат к альбомам
	document.getElementById('pictures_form').style.display = 'none';
//	document.getElementById('userName_button').style.display = 'block';
//	document.getElementById('userName_holder').style.display = 'block';
	document.getElementById('pc_main').style.display = 'block';
//	document.getElementById('pc_main').style.position = 'absolute';
//	document.getElementById('pictures_form').style.position = '';
	curPage = Album_page;
	curPictPage = 0;
	_debug('we back to album page, curPage = ' + curPage);
}

function getPictures ( url ) {	  //запрос на получение картинок
	var req_done = false;
	try {
		try { netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect"); } catch ( e ) {}
		var request = getXmlHttp();
		request.open('GET', url, true);
		request.setRequestHeader("Content-Type", "text/xml");
		request.setRequestHeader("charset", "utf-8");
		request.onreadystatechange = function () {
			if ( request.readyState == 4 && request.status == 404 ) {
				//alert('can not get pictures');
				document.getElementById('alertText').innerHTML = 'can\'t get pictures';
				document.getElementById('alert').style.display = 'block';
				curPage = alert;
				return;
			}
			if ( request.readyState == 4 && request.status == 200 ) {
				req_done = true;
				var iframe = document.createElement('iframe');
				iframe.id = 'iframet';
				iframe.style.visibility = 'hidden';
				iframe.style.width = "0";
				iframe.style.height = "0";
				iframe.innerText = request.responseText;
				var strp = iframe.innerText;
				_debug(strp);
				findpictures(strp);
				drowPicture(0);
				posPictSelector = makeSelectionPict(0);
				document.getElementById('blue').innerText = fotos_text + ' ' + album.pictCount[curSelectedItem + curAlbumPage * albumsAtLine];
				keyEnabled = 1;
			}
		};
		request.send(null); // send object
	} catch ( e ) {}
}

function findpictures ( strp ) {
	picture.names = strp.match(/"title":".*?(?=")/igm);
	if ( !picture.names ) {
		//alert('Album is empty');
		document.getElementById('alertText').innerHTML = empty_album;
		document.getElementById('alert').style.display = 'block';
		curPage = alert;
		return;
	}
	picture.src = strp.match(/\"image\"\:\{\"url\"\:\".*?(?=\")/igm);
	picture.img = strp.match(/\"thumbnails\"\:\[\".*?(?=\")/igm);
	for ( var i = 0; i < album.pictCount[curSelectedItem + curAlbumPage * albumsAtLine]; i++ ) {
		picture.names[i] = picture.names[i + 1].replace(/\"title\"\:\"/ig, "");
		switch ( win.width ) {
			case 720:
				picture.names[i] = picture.names[i].match(/.{1,12}/i);
				break;
			case 1280:
				picture.names[i] = picture.names[i].match(/.{1,18}/i);
				break;
			case 1920:
				picture.names[i] = picture.names[i].match(/.{1,18}/i);
				break;
		}

		picture.src[i] = picture.src[i].replace(/\"image\"\:\{\"url\"\:\"/ig, "");
		picture.img[i] = picture.img[i].replace(/\"thumbnails\"\:\[\"/ig, "");
		switch ( win.width ) {
			case 720:
				picture.img[i] = picture.img[i].replace(/\/s72\//ig, "/s120/");
				break;
			case 1280:
				picture.img[i] = picture.img[i].replace(/\/s72\//ig, "/s216/");
				break;
			case 1920:
				picture.img[i] = picture.img[i].replace(/\/s72\//ig, "/s370/");
				break;
		}

	}
}

function drowPicture ( startIdx ) {  //прорисовка фотографий и названий
	for ( var i = 0; i < maxPictureLines; i++ ) {
		for ( var j = 0; j < maxPictureColum; j++ ) {
			if ( !empty(picture.img[startIdx]) ) {
				document.getElementById('subscript_' + i + '' + j).innerHTML = picture.names[startIdx];
				_debug(i * maxPictureColum + j + startIdx);
				document.getElementById('foto_' + i + '' + j).innerHTML = '<img src="' + picture.img[startIdx] + '" alt="" >';
				_debug(picture.img);
				startIdx++;
			} else {
				document.getElementById('foto_' + i + '' + j).innerHTML = '';
				document.getElementById('subscript_' + i + '' + j).innerHTML = '';
				startIdx++;
			}
		}
	}
	curPage = Pictures_page;
}

//переход к конкретному изображению и проявление форм
function goToPict ( pictX, pictY ) {
	keyEnabled = 0;
	var coordinates = pictY * 4 + pictX + curPictPage * maxPictureLines * maxPictureColum;
	tempPictNo = coordinates;
	goBigPict(coordinates);
	document.getElementById('pictureBig_0').style.display = 'block';
	document.getElementById('pictures_form').style.display = 'none';
	document.getElementById('mb_header_pc').style.display = 'none';
	document.getElementById('footer').style.display = 'none';
	document.getElementById('footer').style.visibility = 'hidden';
	curPage = SinglePicture_page;
	keyEnabled = 1;
}

function goBigPict ( pictNo ) {
	switch ( win.width ) {
		case 720:
			_debug(picture.img[pictNo].replace(/\/s120\//, '/s720/'));
			document.getElementById('pictureBig_0').innerHTML = '<img onload="doIt()" id = "pictureBig" style="top:50px; height: 476px;" src="' + picture.img[pictNo].replace(/\/s120\//, '/s720/') + '" alt="">';
			break;
		case 1280:
			_debug(picture.src[pictNo]);
			document.getElementById('pictureBig_0').innerHTML = '<img onload="doIt()" id = "pictureBig" style="top:50px; " src="' + picture.src[pictNo] + '" alt="">';
			break;
		case 1920:
			_debug(picture.src[pictNo]);
			document.getElementById('pictureBig_0').innerHTML = '<img onload="doIt()" id = "pictureBig" style="top:50px; height: 476px;" src="' + picture.src[pictNo] + '" alt="">';
			break;
	}
}

function pictureChange ( direction ) {	  //переход между картинками по направлению, или в cлучайном порядке
	keyEnabled = 0;
	/*document.getElementById('loading_pict').style.visibility = 'visible';*/
	pictureRealSize.width = null;
	pictureRealSize.height = null;
	switch ( direction ) {
		case 'right':
			//_debug('tempPictNo '+tempPictNo+' album.pictCount[curSelectedItem+curAlbumPage*albumsAtLine] '+album.pictCount[curSelectedItem+curAlbumPage*albumsAtLine]);
			if ( !empty(timer) ) {
				if ( (tempPictNo + 1) < album.pictCount[curSelectedItem + curAlbumPage * albumsAtLine] ) {
					tempPictNo++;
				} else {
					tempPictNo = 0;
				}
			} else {
				if ( (tempPictNo + 1) < album.pictCount[curSelectedItem + curAlbumPage * albumsAtLine] ) {
					tempPictNo++;
				} else {
					if ( !empty(timer) ) {
						clearInterval(timer);
						timer = null;
					}
					goBack();
					document.getElementById('footer').style.visibility = 'visible';
					return;
				}
			}
			break;
		case 'left':
			if ( tempPictNo ) {
				tempPictNo--;
			} else {
				goBack();
				document.getElementById('footer').style.visibility = 'visible';
				return;
			}
			break;
		case 'shuffle':
			tempPictNo = randomNumber(0, (album.pictCount[curSelectedItem + curAlbumPage * albumsAtLine] - 1));
			break;
	}
	_debug('direction ' + direction + ' picture ' + tempPictNo);
	goBigPict(tempPictNo);
}

function recursingUsr ( pict ) {
	try {
		_debug(recursStoper);
		recursStoper++;
		pict.pictheight = window.getComputedStyle(pictureBig, null).getPropertyValue("height");
		pict.pictwidth = window.getComputedStyle(pictureBig, null).getPropertyValue("width");
		if ( empty(pictureRealSize.height) ) {
			pictureRealSize.height = pict.pictheight;
			pictureRealSize.height = pictureRealSize.height.match(/\d*/);
		}
		if ( empty(pictureRealSize.width) ) {
			pictureRealSize.width = pict.pictwidth;
			pictureRealSize.width = pictureRealSize.width.match(/\d*/);
		}
		_debug(pictureRealSize.height + '' + pictureRealSize.width);
	} catch ( e ) {
		return recursing(pict);
	} finally {
		return pict;
	}
}

function doIt () {	//ресайз картинки
	_debug('here');
	var pict = {
		pictheight: null,
		pictwidth : null
	};
	pict = recursingUsr(pict);
	_debug(pict.pictheight + ' ' + pict.pictwidth);
	pict.pictheight = pict.pictheight.match(/\d*/);
	pict.pictwidth = pict.pictwidth.match(/\d*/);
	_debug(pict.pictheight + ' ' + pict.pictwidth);
	var yCoef = pictureRealSize.height / win.height;//pict.pictheight/win.height;
	var xCoef = pictureRealSize.width / win.width;//pict.pictwidth/win.width;
	var yCoefB = pictureRealSize.height / (win.height - 80);//pict.pictheight/win.height;
	var xCoefB = pictureRealSize.width / (win.width - 80);//pict.pictwidth/win.width;
	_debug('coefs: ' + xCoef + ':' + yCoef);
	switch ( aspect ) {
		case 4: //fit on + borders
			_debug('coefsB: ' + xCoefB + ':' + yCoefB);
			if ( pictureSize ) {
				pictureSize = 0;
				document.getElementById('pictureBig').className = 'enlarge0';
			}
			var shift = 0;
			if ( yCoef > xCoef ) {
				_debug('original thin picture height: ' + pict.pictheight);
				_debug('original thin picture width: ' + pict.pictwidth);
				pict.pictheight = pictureRealSize.height / yCoefB - (pictureRealSize.height / yCoefB) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
				pict.pictwidth = pictureRealSize.width / yCoefB - (pictureRealSize.width / yCoefB) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
				_debug('thin picture height: ' + pict.pictheight);
				_debug('thin picture width: ' + pict.pictwidth);
				document.getElementById('pictureBig').style.marginTop = '30px';
				shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
				_debug('shiftLeft: ' + shift);
				document.getElementById('pictureBig').style.marginLeft = shift + 'px';// - too short
			} else {
				_debug('original thick picture height: ' + pict.pictheight);
				_debug('original thick picture width: ' + pict.pictwidth);
				pict.pictheight = pictureRealSize.height / xCoefB - (pictureRealSize.height / xCoefB) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
				pict.pictwidth = pictureRealSize.width / xCoefB - (pictureRealSize.width / xCoefB) % 1;//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
				_debug('lower picture height: ' + pict.pictheight);
				_debug('lower picture width: ' + pict.pictwidth);
				shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
				_debug('shiftTop: ' + shift);
				document.getElementById('pictureBig').style.marginTop = (shift - (win.width / 70)) + 'px';// - too short
				document.getElementById('pictureBig').style.marginLeft = '40px';
			}
			document.getElementById('pictureBig').style.height = pict.pictheight + 'px';
			document.getElementById('pictureBig').style.width = pict.pictwidth + 'px';
			break;
		case 2: //fullscreen
			document.getElementById('pictureBig').style.height = win.height + 'px';
			document.getElementById('pictureBig').style.width = win.width + 'px';
			document.getElementById('pictureBig').style.marginTop = '0px';
			document.getElementById('pictureBig').style.marginLeft = '0px';
			break;
		case 3: //optimal must be BIG
			if ( (yCoef > xCoef && yCoef < 1) || (yCoef < xCoef && yCoef > 1) ) {
				_debug('original thin picture height: ' + pict.pictheight);
				_debug('original thin picture width: ' + pict.pictwidth);
				if ( win.width == 720 ) {
					pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
					pict.pictwidth = (pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1) / 1.42 - ((pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1) / 1.42) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
					_debug('thin picture height: ' + pict.pictheight);
					_debug('thin picture width: ' + pict.pictwidth);
					document.getElementById('pictureBig').style.marginTop = '0px';
					shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
					_debug('shiftLeft: ' + shift);
					document.getElementById('pictureBig').style.marginLeft = shift + 'px';// - too short
				} else {
					_debug('original thin picture height: ' + pict.pictheight);
					_debug('original thin picture width: ' + pict.pictwidth);
					pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
					pict.pictwidth = pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
					_debug('thin picture height: ' + pict.pictheight);
					_debug('thin picture width: ' + pict.pictwidth);
					document.getElementById('pictureBig').style.marginTop = '0px';
					shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
					_debug('shiftLeft: ' + shift);
					document.getElementById('pictureBig').style.marginLeft = shift + 'px';// - too short
				}
			} else {
				if ( win.width == 720 ) {
					_debug('original thick picture height: ' + pict.pictheight);
					_debug('original thick picture width: ' + pict.pictwidth);
					if ( (((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) - ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) % 1) < win.height ) {
						_debug('here++++++++++++++++++++++');
						pict.pictheight = ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) - ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
						pict.pictwidth = (pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1);//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
					} else {
						pict.pictheight = 576;
						_debug('pictureRealSize.height' + pictureRealSize.height);
						var tempcoef = (576 / pictureRealSize.height);
						_debug('tempcoef ' + tempcoef);
						_debug((pictureRealSize.width / xCoef) * tempcoef);
						pict.pictwidth = ((((pictureRealSize.width) * tempcoef) / 142) * 100) - ((((pictureRealSize.width) * tempcoef) / 142) * 100) % 1;

					}
					_debug('lower picture height: ' + pict.pictheight);
					_debug('lower picture width: ' + pict.pictwidth);
					shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
					_debug('shiftTop: ' + shift);
					document.getElementById('pictureBig').style.marginTop = shift + 'px';// - too short
					document.getElementById('pictureBig').style.marginLeft = ((win.width - pict.pictwidth) / 2) + 'px';
				} else {
					_debug('original thick picture height: ' + pict.pictheight);
					_debug('original thick picture width: ' + pict.pictwidth);
					pict.pictheight = pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
					pict.pictwidth = pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1;//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
					_debug('lower picture height: ' + pict.pictheight);
					_debug('lower picture width: ' + pict.pictwidth);
					shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
					_debug('shiftTop: ' + shift);
					document.getElementById('pictureBig').style.marginTop = shift + 'px';// - too short
					document.getElementById('pictureBig').style.marginLeft = '0px';
				}
			}
			document.getElementById('pictureBig').style.height = pict.pictheight + 'px';
			document.getElementById('pictureBig').style.width = pict.pictwidth + 'px';
			document.getElementById('pictureBig').className = 'enlarge1';
			pictureSize = 1;
			break;
		case 0: //feet on(horisontal or vertical)
			if ( pictureSize ) {
				document.getElementById('pictureBig').className = 'enlarge0';
				pictureSize = 0;
			}
			var shift = 0;
			if ( yCoef > xCoef ) {
				pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;
				pict.pictwidth = pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1;//pict.pictwidth/yCoef  - (pict.pictwidth/yCoef)%1;
				document.getElementById('pictureBig').style.marginTop = '0px';
				shift = (win.width - pict.pictwidth) / 2 - ((win.width) / 70);
				_debug('Leftshift' + shift);
				document.getElementById('pictureBig').style.marginLeft = shift + 'px';// - too short
			} else {
				pict.pictheight = pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;
				pict.pictwidth = pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1;//pict.pictwidth/xCoef  - (pict.pictwidth/xCoef)%1;
				shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1;
				_debug('Topshift' + shift);
				document.getElementById('pictureBig').style.marginTop = (shift - (win.width / 70)) + 'px';// - too short
				document.getElementById('pictureBig').style.marginLeft = '0px';
			}
			document.getElementById('pictureBig').style.height = pict.pictheight + 'px';
			document.getElementById('pictureBig').style.width = pict.pictwidth + 'px';
			break;
		case 1: //if ratio weird
			if ( win.width == 720 ) {
				var shift = 0;
				if ( (yCoef > xCoef && yCoef < 1) || (yCoef < xCoef && yCoef > 1) ) {
					_debug('original thin picture height: ' + pict.pictheight);
					_debug('original thin picture width: ' + pict.pictwidth);
					if ( win.width == 720 ) {
						pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
						pict.pictwidth = (pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1) / 1.42 - ((pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1) / 1.42) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
						_debug('thin picture height: ' + pict.pictheight);
						_debug('thin picture width: ' + pict.pictwidth);
						document.getElementById('pictureBig').style.marginTop = '0px';
						shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
						_debug('shiftLeft: ' + shift);
						document.getElementById('pictureBig').style.marginLeft = (shift - 10) + 'px';// - too short
					} else {
						_debug('original thin picture height: ' + pict.pictheight);
						_debug('original thin picture width: ' + pict.pictwidth);
						pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
						pict.pictwidth = pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
						_debug('thin picture height: ' + pict.pictheight);
						_debug('thin picture width: ' + pict.pictwidth);
						document.getElementById('pictureBig').style.marginTop = '0px';
						shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
						_debug('shiftLeft: ' + shift);
						document.getElementById('pictureBig').style.marginLeft = shift + 'px';// - too short
					}
				} else {
					if ( win.width == 720 ) {
						_debug('original thick picture height: ' + pict.pictheight);
						_debug('original thick picture width: ' + pict.pictwidth);
						if ( (((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) - ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) % 1) < win.height ) {
							_debug('here++++++++++++++++++++++');
							pict.pictheight = ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) - ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
							pict.pictwidth = (pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1);//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
						} else {
							pict.pictheight = 576;
							_debug('pictureRealSize.height' + pictureRealSize.height);
							var tempcoef = (576 / pictureRealSize.height);
							_debug('tempcoef ' + tempcoef);
							_debug((pictureRealSize.width / xCoef) * tempcoef);
							pict.pictwidth = ((((pictureRealSize.width) * tempcoef) / 142) * 100) - ((((pictureRealSize.width) * tempcoef) / 142) * 100) % 1;

						}

						_debug('lower picture height: ' + pict.pictheight);
						_debug('lower picture width: ' + pict.pictwidth);
						shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
						_debug('shiftTop: ' + shift);
						document.getElementById('pictureBig').style.marginTop = shift + 'px';// - too short
						document.getElementById('pictureBig').style.marginLeft = (((win.width - pict.pictwidth) / 2) - 10) + 'px';
						document.getElementById('pictureBig').style.left = '0px';
						document.getElementById('pictureBig').style.paddingLeft = '0px';
						_debug('marginLeft' + document.getElementById('pictureBig').style.marginLeft);
						_debug('Left' + document.getElementById('pictureBig').style.left);
					} else {
						_debug('original thick picture height: ' + pict.pictheight);
						_debug('original thick picture width: ' + pict.pictwidth);
						pict.pictheight = pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
						pict.pictwidth = pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1;//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
						_debug('lower picture height: ' + pict.pictheight);
						_debug('lower picture width: ' + pict.pictwidth);
						shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
						_debug('shiftTop: ' + shift);
						document.getElementById('pictureBig').style.marginTop = shift + 'px';// - too short
						document.getElementById('pictureBig').style.marginLeft = '0px';
					}
				}
				document.getElementById('pictureBig').style.height = pict.pictheight + 'px';
				document.getElementById('pictureBig').style.width = pict.pictwidth + 'px';
			}
			break;
	}
	_debug('current aspect = ' + aspect + ' height = ' + document.getElementById('pictureBig').style.height + ' width =  ' + document.getElementById('pictureBig').style.width);
	keyEnabled = 1;
}

function goBack () {					  //возврат к картинкам
	curPage = Pictures_page;
	document.getElementById('pictureBig_0').style.display = 'none';
	/*document.getElementById('topLabel').style.display = 'block';*/
	document.getElementById('pictures_form').style.display = 'block';
	document.getElementById('mb_header_pc').style.display = 'block';
	document.getElementById('footer').style.display = 'block';
	document.getElementById('blackScreen').style.display = 'none';
	keyEnabled = 1;
}

function unselectItem ( colum, page ) {
	_debug('we did it');
	document.getElementById('album_' + colum).className = "pc_album_box";
	document.getElementById('tags_1' + colum).className = 't17w box_date';
	document.getElementById('tags_2' + colum).className = 't17w box_date';
	document.getElementById('tags_3' + colum).className = 't17w box_qtyph';
	document.getElementById('tags_0' + colum).className = 't18w shadow_b bold';
	curAlbumIdx = colum;
	return colum;
}

function selectItem ( colum, page ) {	//выделение в странице альбомов
	_debug('albumsAtLine ' + albumsAtLine + ' page ' + page + ' colum ' + colum);
	document.getElementById('album_' + colum).className = "pc_album_box_act";
	document.getElementById('tags_1' + colum).className = 't17blue box_date';
	document.getElementById('tags_2' + colum).className = 't17blue box_date';
	document.getElementById('tags_3' + colum).className = 't17blue box_qtyph';
	document.getElementById('tags_0' + colum).className = 't18blue shadow_w bold';
	curAlbumIdx = colum;
	return colum;
}

function makeSelectionPict ( direction ) {  //выделение картинки в странице картинок и результатов поиска, аргумент - направление, возвращает (x,y) селектора
	var selection, shiftLimit, curShift;
	if ( curPage == 5 ) {
		selection = 'selectionSearch';
	} else {
		if ( curPage == 2 ) { selection = 'selection'; }
	}
	if ( isNaN(tempPosition[0]) ) { tempPosition[0] = 78; }
	if ( isNaN(tempPosition[1]) ) {
		if ( win.height == 480 ) {
			tempPosition[1] = 22;
		} else {
			tempPosition[1] = 48;
		}
	}
	if ( selection == 'selection' ) {
		switch ( direction ) {
			default:
				tempPosition[0] = 78;
				tempPosition[1] = 48;
				document.getElementById(selection).style.left = '78px';
				document.getElementById(selection).style.top = '48px';
				document.getElementById('subscript_00').className = 'text_title t16b';
				break;
			case '00':
				document.getElementById(selection).style.top = '48px';
				tempPosition[1] = 48;
				document.getElementById(selection).style.left = '78px';
				tempPosition[0] = 78;
				break;
			case '01':
				document.getElementById(selection).style.top = (48 + verShift) + 'px';
				tempPosition[1] = (48 + verShift);
				document.getElementById(selection).style.left = '78px';
				tempPosition[0] = 78;
				break;
			case '10':
				document.getElementById(selection).style.top = '48px';
				tempPosition[1] = 48;
				document.getElementById(selection).style.left = (78 + horShift) + 'px';
				tempPosition[0] = (78 + horShift);
				break;
			case '11':
				document.getElementById(selection).style.top = (48 + verShift) + 'px';
				tempPosition[1] = (48 + verShift);
				document.getElementById(selection).style.left = (78 + horShift) + 'px';
				tempPosition[0] = (78 + horShift);
				break;
			case '20':
				document.getElementById(selection).style.top = '48px';
				tempPosition[1] = 48;
				document.getElementById(selection).style.left = (78 + (horShift * 2)) + 'px';
				tempPosition[0] = (78 + (horShift * 2));
				break;
			case '21':
				document.getElementById(selection).style.top = (48 + verShift) + 'px';
				tempPosition[1] = (48 + verShift);
				document.getElementById(selection).style.left = (78 + (horShift * 2)) + 'px';
				tempPosition[0] = (78 + (horShift * 2));
				break;
			case '30':
				document.getElementById(selection).style.top = '48px';
				tempPosition[1] = 48;
				document.getElementById(selection).style.left = (78 + (horShift * 3)) + 'px';
				tempPosition[0] = (78 + (horShift * 3));
				break;
			case '31':
				document.getElementById(selection).style.top = (48 + verShift) + 'px';
				tempPosition[1] = (48 + verShift);
				document.getElementById(selection).style.left = (78 + (horShift * 3)) + 'px';
				tempPosition[0] = (78 + (horShift * 3));
				break;
			case 'up':
				tempPosition[1] = posPictSelector[1];
				if ( tempPosition[1] ) {
					if ( posPictSelector[1] > 182 ) {
						tempPosition[1] -= verShift;
						document.getElementById(selection).style.top = tempPosition[1] + 'px'
					}
				} else {
					if ( posPictSelector[1] > 182 ) {
						document.getElementById(selection).style.top = '48px';
						tempPosition[1] = 48;
					}
				}
				break;
			case 'down':
				tempPosition[1] = posPictSelector[1];
				shiftLimit = album.pictCount[curSelectedItem + curAlbumPage * albumsAtLine] / (maxPictureLines * maxPictureColum);
				shiftLimit = shiftLimit - curPictPage;
				shiftLimit = (shiftLimit * maxPictureLines * maxPictureColum);
				curShift = (((tempPosition[0] - 78) / horShift) + 1);
				if ( shiftLimit > maxPictureColum && curShift < (shiftLimit - (maxPictureColum - 1)) ) {
					if ( tempPosition[1] ) {
						if ( posPictSelector[1] < (48 + (verShift * (maxPictureLines - 1))) ) {
							tempPosition[1] += verShift;
							document.getElementById(selection).style.top = tempPosition[1] + 'px'
						}
					} else {
						document.getElementById(selection).style.top = '193px';
						tempPosition[1] = 196;
					}
				}
				break;
			case 'left':
				tempPosition[0] = posPictSelector[0];
				if ( tempPosition ) {
					if ( posPictSelector[0] > 100 ) {
						tempPosition[0] -= horShift;
						document.getElementById(selection).style.left = tempPosition[0] + 'px'
					}
				} else {
					if ( posPictSelector[0] > 100 ) {
						document.getElementById(selection).style.left = '78px';
						tempPosition[0] = 78;
					}
				}
				break;
			case 'right':
				tempPosition[0] = posPictSelector[0];
				shiftLimit = album.pictCount[curSelectedItem + curAlbumPage * albumsAtLine] / (maxPictureLines * maxPictureColum);
				shiftLimit = shiftLimit - curPictPage;
				shiftLimit = (shiftLimit * maxPictureLines * maxPictureColum);
				curShift = (((tempPosition[0] - 78) / horShift) + 1);
				if ( (curShift + (((tempPosition[1] - 48) / verShift)) * maxPictureColum) < shiftLimit ) {
					if ( tempPosition[0] ) {
						if ( posPictSelector[0] < (78 + (horShift * (maxPictureColum - 1))) ) {
							tempPosition[0] += horShift;
							document.getElementById(selection).style.left = tempPosition[0] + 'px'
						}
					} else {
						document.getElementById(selection).style.left = '222px';
						tempPosition[0] = 222;
					}
				}
				break;
		}
	} else {
		switch ( direction ) {
			case '00':
				if ( win.height == 480 ) {
					document.getElementById(selection).style.top = '2px';
					tempPosition[1] = 22;
				} else {
					document.getElementById(selection).style.top = '48px';
					tempPosition[1] = 48;
				}
				document.getElementById(selection).style.left = '78px';
				tempPosition[0] = 78;
				break;
			case '01':
				if ( win.height == 480 ) {
					document.getElementById(selection).style.top = (22 + verShiftSear) + 'px';
					tempPosition[1] = (22 + verShiftSear);
				} else {
					document.getElementById(selection).style.top = (48 + verShiftSear) + 'px';
					tempPosition[1] = (48 + verShiftSear);
				}
				document.getElementById(selection).style.left = '78px';
				tempPosition[0] = 78;
				break;
			case '10':
				if ( win.height == 480 ) {
					document.getElementById(selection).style.top = '22px';
					tempPosition[1] = 22;
				} else {
					document.getElementById(selection).style.top = '48px';
					tempPosition[1] = 48;
				}
				document.getElementById(selection).style.left = (78 + horShiftSear) + 'px';
				tempPosition[0] = (78 + horShiftSear);
				break;
			case '11':
				if ( win.height == 480 ) {
					document.getElementById(selection).style.top = (22 + verShiftSear) + 'px';
					tempPosition[1] = (22 + verShiftSear);
				} else {
					document.getElementById(selection).style.top = (48 + verShiftSear) + 'px';
					tempPosition[1] = (48 + verShiftSear);
				}
				document.getElementById(selection).style.left = (78 + horShiftSear) + 'px';
				tempPosition[0] = (78 + horShiftSear);
				break;
			case '20':
				if ( win.height == 480 ) {
					document.getElementById(selection).style.top = '22px';
					tempPosition[1] = 22;
				} else {
					document.getElementById(selection).style.top = '48px';
					tempPosition[1] = 48;
				}
				document.getElementById(selection).style.left = (78 + (horShiftSear * 2)) + 'px';
				tempPosition[0] = (78 + (horShiftSear * 2));
				break;
			case '21':
				if ( win.height == 480 ) {
					document.getElementById(selection).style.top = (22 + verShiftSear) + 'px';
					tempPosition[1] = (22 + verShiftSear);
				} else {
					document.getElementById(selection).style.top = (48 + verShiftSear) + 'px';
					tempPosition[1] = (48 + verShiftSear);
				}
				document.getElementById(selection).style.left = (78 + (horShiftSear * 2)) + 'px';
				tempPosition[0] = (78 + (horShiftSear * 2));
				break;
			case '30':
				if ( win.height == 480 ) {
					document.getElementById(selection).style.top = '22px';
					tempPosition[1] = 22;
				} else {
					document.getElementById(selection).style.top = '48px';
					tempPosition[1] = 48;
				}
				document.getElementById(selection).style.left = (78 + (horShiftSear * 3)) + 'px';
				tempPosition[0] = (78 + (horShiftSear * 3));
				break;
			case '31':
				if ( win.height == 480 ) {
					document.getElementById(selection).style.top = (22 + verShiftSear) + 'px';
					tempPosition[1] = (22 + verShiftSear);
				} else {
					document.getElementById(selection).style.top = (48 + verShiftSear) + 'px';
					tempPosition[1] = (48 + verShiftSear);
				}
				document.getElementById(selection).style.left = (78 + (horShiftSear * 3)) + 'px';
				tempPosition[0] = (78 + (horShiftSear * 3));
				break;
			case 'up':
				tempPosition[1] = posPictSelector[1];
				if ( tempPosition[1] ) {
					if ( posPictSelector[1] > (verShiftSear) ) {
						tempPosition[1] -= verShiftSear;
						document.getElementById(selection).style.top = tempPosition[1] + 'px'
					}
				} else {
					if ( posPictSelector[1] > 182 ) {
						if ( win.height == 480 ) {
							document.getElementById(selection).style.top = '18px';
							tempPosition[1] = 22;
						} else {
							document.getElementById(selection).style.top = '48px';
							tempPosition[1] = 48;
						}
					}
				}
				break;
			case 'down':
				tempPosition[1] = posPictSelector[1];
				shiftLimit = searchCount[12];
				shiftLimit -= searchPage * maxPictureLines * maxPictureColum;
				_debug('shiftLimit: ' + shiftLimit);
				curShift = (((tempPosition[0] - 78) / horShift) + 1);
				if ( shiftLimit > maxPictureColum ) {//shiftLimit%(maxPictureLines*maxPictureColum)
					if ( tempPosition[1] ) {
						if ( posPictSelector[1] < (verShiftSear * (maxPictureLines - 1) + 48) ) {
							tempPosition[1] += verShiftSear;
							_debug('down: ' + tempPosition[1]);
							document.getElementById(selection).style.top = tempPosition[1] + 'px'
						}
					} else {
						if ( win.height == 480 ) {
							document.getElementById(selection).style.top = (verShiftSear + 19) + 'px';
							tempPosition[1] = (verShiftSear + 22);
						} else {
							document.getElementById(selection).style.top = (verShiftSear + 49) + 'px';
							tempPosition[1] = (verShiftSear + 48);
						}
					}
				}
				break;
			case 'left':
				tempPosition[0] = posPictSelector[0];
				if ( tempPosition ) {
					if ( posPictSelector[0] > horShiftSear ) {
						tempPosition[0] -= horShiftSear;
						document.getElementById(selection).style.left = tempPosition[0] + 'px'
					}
				} else {
					if ( posPictSelector[0] > 100 ) {
						document.getElementById(selection).style.left = '78px';
						tempPosition[0] = 78;
					}
				}
				break;
			case 'right':
				tempPosition[0] = posPictSelector[0];
				shiftLimit = searchCount[12];
				shiftLimit -= searchPage * maxPictureLines * maxPictureColum;
				if ( shiftLimit > ((((tempPosition[0] - 78) / horShiftSear) + ((tempPosition[1] - 48) / verShiftSear)) + 1) )
					if ( tempPosition[0] ) {
						if ( posPictSelector[0] < (horShiftSear * (maxPictureColum - 1) + 50) ) {
							tempPosition[0] += horShiftSear;
							document.getElementById(selection).style.left = tempPosition[0] + 'px'
						}
					} else {
						document.getElementById(selection).style.left = (horShiftSear + 78) + 'px';
						tempPosition[0] = (horShiftSear + 78);
					}
				break;
		}
	}
	_debug(tempPosition);
	return tempPosition;
}

function getSearch ( searchPage ) {	 //создание ссылки для поиска в качестве аргумента - страница (выводятся по maxPictureLines*maxPictureColum картинок за запрос)
	stb.HideVirtualKeyboard();
	curPage = Search_page;
	var url = document.getElementById('mainPage_holder_1').value;
	document.getElementById('owner').innerHTML = s_res_for + ' "' + url + '" ';
	var searchLink = 'http://picasaweb.google.com/data/feed/base/all?kind=photo&alt=jsonc&v=2&start-index=' + (searchPage * maxPictureLines * maxPictureColum + 1) + '&max-results=' + ((maxPictureLines * maxPictureColum) + 1) + '&q=' + url;
	_debug(searchLink);
	searchReq(searchLink);
}

function searchReq ( url ) {		//создание аякс запроса для получения результатов поиска
	keyEnabled = 0;
	var req_done = false;
	try {
		try { netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect"); } catch ( e ) {}
		var request = getXmlHttp();
		request.open('GET', url, true);
		request.setRequestHeader("Content-Type", "text/xml");
		request.setRequestHeader("charset", "utf-8");
		request.onreadystatechange = function () {
			if ( request.readyState == 4 && request.status == 404 ) {
				//alert('wrong name or lost internet connection');
				document.getElementById('alertText').innerHTML = null_result;
				document.getElementById('alert').style.display = 'block';
				curPage = alert;
				return;
			}
			if ( request.readyState == 4 && request.status == 200 ) {
				req_done = true;
				var iframe = document.createElement('iframe');
				iframe.id = 'iframet';
				iframe.style.visibility = 'hidden';
				iframe.style.width = "0";
				iframe.style.height = "0";
				iframe.innerText = request.responseText;
				var searchRes = iframe.innerText;
				//_debug(searchRes);
				showResult(searchRes, 0);
			}
			keyEnabled = 1;
		};
		request.send(null); // send object
	} catch ( e ) { }
}

//str - результат запроса, viewFoto - (0 - мы на странице отображения результатов, 1 - мы просматриваем отдельную картинку)
//парсинг результатов запроса для определения:
//  searchCount - количество найденых
//  searchResults - ссылки на картинки
//	  0+5*х - картинка с разрешением равным текущему
//	  1+5*х - оригинал картинки
//	  2+5*х - 72х72
//	  3+5*х - 144х144
//	  4+5*х - 288х288
//  names - названия картинок(обрезаные по 11 символов)
//  autors - имена авторов(аналогично)
//и отображение результатов
function showResult ( str, viewFoto ) {
	var i, j,
		req = /http:\/\/.{10,199}?\.jpg/igm,
		urls = str.match(req);

	_debug('str: \n' + str);
	_debug('links \n' + urls);
	if ( !empty(urls) ) {
		for ( i = 0; i < urls.length; i += 5 ) {
			urls[i] = urls[i].replace(/s288/, 's' + (win.width - 30));
		}
		// parse result string to JSON object
		var result = JSON.parse(str);
		searchResults = urls;
		_debug(searchResults);
		req = /totalItems":\d*,?/igm;
		var totalItems = str.match(req);
		searchCount = [];
		searchCount[12] = result.data.totalItems || 1000000;
		totalItems = searchCount[12];
		_debug('searchCount: ' + searchCount[12]);
		//"image":{"url":"http://lh3.ggpht.com/_dUrulRugv_4/SxU731vC3nI/AAAAAAAAAkk/QPZ-o7J2lvE/2009-06-12%20019.jpg"
		req = /image":.{10,120}?\.jpg/igm;
		req = /"title":"(?!(Search Results)).*?"(?=,("description"))/igm;
		var names = str.match(req);
		for ( i = 0; i < names.length; i++ ) {
			names[i] = names[i].replace(/"title":/, '');
			names[i] = names[i].replace(/"/gm, '');
			_debug(names[i]);
			_debug('after: ' + names[i]);
		}
		_debug('names.length ' + names.length);
		req = /"author":".*?"/igm;
		var autors = str.match(req);
		_debug('autors length = ' + autors.length);
		for ( j = 0; j < autors.length; j++ ) {
			_debug('autors before ' + autors[j]);
			autors[j] = autors[j].replace(/"author":/, '');
			autors[j] = autors[j].replace(/"/gm, '');
			autors[j] = autors[j].match(/.{1,16}/i);
			_debug('autors after ' + autors[j]);
		}

		if ( !viewFoto ) {
			document.getElementById('owner').innerHTML += totalItems;
			document.getElementById('blue').style.visibility = 'visible';
			document.getElementById('blue').innerHTML = page + ' ' + (searchPage + 1) + ' ' + of + ' ' + (searchCount[12] / (maxPictureLines * maxPictureColum) - ((searchCount[12] % (maxPictureLines * maxPictureColum))) / (maxPictureLines * maxPictureColum));
		}

		for ( i = 0; i < maxPictureLines; i++ ) {
			for ( j = 0; j < maxPictureColum; j++ ) {
				if ( urls[((i * 4 + j) * 5) + 3] ) {
					switch ( win.height ) {
						case 480:
							document.getElementById('fotoS_' + i + '' + j).style.width = '130px';
							document.getElementById('fotoS_' + i + '' + j).style.height = '106px';
							document.getElementById('fotoS_' + i + '' + j).innerHTML = '<img style="margin-left:4px;" src="' + urls[((i * 4 + j) * 5) + 3].replace(/s144/, "s100") + '" alt="">';
							break;
						case 576:
							document.getElementById('fotoS_' + i + '' + j).style.width = '130px';
							document.getElementById('fotoS_' + i + '' + j).style.height = '126px';
							document.getElementById('fotoS_' + i + '' + j).innerHTML = '<img style="margin-left:4px;" src="' + urls[((i * 4 + j) * 5) + 3].replace(/s144/, "s120") + '" alt="">';
							break;
						case 720:
							document.getElementById('fotoS_' + i + '' + j).style.width = '190px';
							document.getElementById('fotoS_' + i + '' + j).style.height = '190px';
							document.getElementById('fotoS_' + i + '' + j).innerHTML = '<img style="margin-left:-4px;" src="' + urls[((i * 4 + j) * 5) + 3].replace(/s144/, "s190") + '" alt="">';
							break;
						case 1080:
							document.getElementById('fotoS_' + i + '' + j).style.width = '330px';
							document.getElementById('fotoS_' + i + '' + j).style.height = '330px';
							document.getElementById('fotoS_' + i + '' + j).innerHTML = '<img style="margin-left:-4px;" src="' + urls[((i * 4 + j) * 5) + 4].replace(/s288/, "s320") + '" alt="">';
							break;
					}
					document.getElementById('subscriptS_' + i + '' + j).innerHTML = names[(i * 4 + j)];
					document.getElementById('subscriptS_' + (i + 2) + '' + j).innerHTML = autors[(i * 4 + j)];
					//_debug(document.getElementById('foto_'+i+''+j).innerHTML)
				} else {
					document.getElementById('fotoS_' + i + '' + j).innerHTML = '';
					document.getElementById('subscriptS_' + i + '' + j).innerHTML = '';
					document.getElementById('subscriptS_' + (i + 2) + '' + j).innerHTML = '';
				}
			}
		}
	} else {
		for ( i = 0; i < maxPictureLines; i++ ) {
			for ( j = 0; j < maxPictureColum; j++ ) {
				document.getElementById('fotoS_' + i + '' + j).innerHTML = '';
				document.getElementById('subscriptS_' + i + '' + j).innerHTML = '';
				document.getElementById('subscriptS_' + (i + 2) + '' + j).innerHTML = '';
				//_debug(document.getElementById('foto_'+i+''+j).innerHTML)
			}
		}
		//alert('there is no foto for your keyword');
		document.getElementById('alertText').innerHTML = null_result;
		document.getElementById('alert').style.display = 'block';
		curPage = alert;
	}
}

//"title":"2009-06-12 019.jpg","description"
//"author":"Jo"
//http://picasaweb.google.com/data/feed/base/all?kind=photo&q=ключевое_слово base<-->api
//http://picasaweb.google.com/data/feed/base/all?kind=photo&alt=jsonc&v=2&callback=some&start-index=1&max-results=10&q=
function showCurPict ( pictX, pictY ) {
	document.getElementById('search_form').style.display = 'none';
	document.getElementById('pictureBig_0').style.display = 'block';
	switch ( win.width ) {
		case 720:
			document.getElementById('pictureBig_0').innerHTML = '<img onload="resize();" id="BigPict"  src="' + searchResults[(pictX + pictY * 4) * 5] + '" alt="">';
			break;
		case 1280:
			document.getElementById('pictureBig_0').innerHTML = '<img onload="resize();" id="BigPict"  src="' + searchResults[(pictX + pictY * 4) * 5] + '" alt="">';
			break;
		case 1920:
			document.getElementById('pictureBig_0').innerHTML = '<img onload="resize();" id="BigPict"  src="' + searchResults[(pictX + pictY * 4) * 5 + 1] + '" alt="">';
			break;
	}
	drowFooter(3);
	document.getElementById('blackScreen').style.display = 'block';
	//_debug(searchResults);
	//_debug(document.getElementById('pictureBig_0').innerHTML);
	curPictS = (pictX + pictY * 4);
	curPage = Searched_pict;
}

function recursing ( pict ) {
	try {
		_debug(recursStoper);
		recursStoper++;
		if ( recursStoper > 200 ) {
			recursStoper = 0;
			pict.pictheight = '576px';
			pict.pictwidth = '720px';
			return pict;
		}
		pict.pictheight = window.getComputedStyle(BigPict, null).getPropertyValue("height");
		pict.pictwidth = window.getComputedStyle(BigPict, null).getPropertyValue("width");
		if ( empty(pictureRealSize.height) ) {
			pictureRealSize.height = pict.pictheight;
			pictureRealSize.height = pictureRealSize.height.match(/\d*/);
		}
		if ( empty(pictureRealSize.width) ) {
			pictureRealSize.width = pict.pictwidth;
			pictureRealSize.width = pictureRealSize.width.match(/\d*/);
		}
		_debug('real X real Y' + pictureRealSize.width + ' ' + pictureRealSize.height);//720 540
	}
	catch ( e ) {
		return recursing(pict);
	} finally {
		return pict;
	}
}

function resize () {
	_debug('here');
	/*document.getElementById('loading_pict').style.visibility = 'hidden';*/
	var pict = {
		pictheight: null,
		pictwidth : null
	};
	pict = recursing(pict);
	_debug(pict.pictheight + ' ' + pict.pictwidth);
	pict.pictheight = pict.pictheight.match(/\d*/); //1020
	pict.pictwidth = pict.pictwidth.match(/\d*/); //1860
	_debug('current pict.pictheight: ' + pict.pictheight + ' current pict.pictwidth ' + pict.pictwidth);
	var yCoef = pictureRealSize.height / win.height;//pict.pictheight/win.height;// 0.66
	var xCoef = pictureRealSize.width / win.width;//pict.pictwidth/win.width;// 0.28
	var yCoefB = pictureRealSize.height / (win.height - 80);//pict.pictheight/win.height;// 0.66
	var xCoefB = pictureRealSize.width / (win.width - 80);//pict.pictwidth/win.width;// 0.28
	_debug('coefs: ' + xCoef + ':' + yCoef);
	switch ( aspect ) {
		case 4: //fit on + borders
			_debug('coefsB: ' + xCoefB + ':' + yCoefB);
			if ( pictureSize ) {
				pictureSize = 0;
				document.getElementById('BigPict').className = 'enlarge0';
			}
			var shift = 0;
			if ( yCoef > xCoef ) {
				_debug('original thin picture height: ' + pict.pictheight);
				_debug('original thin picture width: ' + pict.pictwidth);
				pict.pictheight = pictureRealSize.height / yCoefB - (pictureRealSize.height / yCoefB) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
				pict.pictwidth = pictureRealSize.width / yCoefB - (pictureRealSize.width / yCoefB) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
				_debug('thin picture height: ' + pict.pictheight);
				_debug('thin picture width: ' + pict.pictwidth);
				document.getElementById('BigPict').style.marginTop = '30px';
				shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
				_debug('shiftLeft: ' + shift);
				document.getElementById('BigPict').style.marginLeft = shift + 'px';// - too short
			} else {
				_debug('original thick picture height: ' + pict.pictheight);
				_debug('original thick picture width: ' + pict.pictwidth);
				pict.pictheight = pictureRealSize.height / xCoefB - (pictureRealSize.height / xCoefB) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
				pict.pictwidth = pictureRealSize.width / xCoefB - (pictureRealSize.width / xCoefB) % 1;//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
				_debug('lower picture height: ' + pict.pictheight);
				_debug('lower picture width: ' + pict.pictwidth);
				shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1;
				_debug('shiftTop: ' + shift);
				document.getElementById('BigPict').style.marginTop = (shift - (win.width / 70)) + 'px';// - too short
				document.getElementById('BigPict').style.marginLeft = '40px';
			}
			document.getElementById('BigPict').style.height = pict.pictheight + 'px';
			document.getElementById('BigPict').style.width = pict.pictwidth + 'px';
			break;
		case 2: //fullscreen
			document.getElementById('BigPict').style.height = win.height + 'px';
			document.getElementById('BigPict').style.width = win.width + 'px';
			document.getElementById('BigPict').style.marginTop = '0px';
			document.getElementById('BigPict').style.marginLeft = '0px';
			break;
		case 3: //enlarged
			var shift = 0;
			if ( (yCoef > xCoef && yCoef < 1) || (yCoef < xCoef && yCoef > 1) ) {
				_debug('original thin picture height: ' + pict.pictheight);
				_debug('original thin picture width: ' + pict.pictwidth);
				if ( win.width == 720 ) {
					pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
					pict.pictwidth = (pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1) / 1.42 - ((pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1) / 1.42) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
					_debug('thin picture height: ' + pict.pictheight);
					_debug('thin picture width: ' + pict.pictwidth);
					document.getElementById('BigPict').style.marginTop = '0px';
					shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
					_debug('shiftLeft: ' + shift);
					document.getElementById('BigPict').style.marginLeft = shift + 'px';// - too short
				} else {
					_debug('original thin picture height: ' + pict.pictheight);
					_debug('original thin picture width: ' + pict.pictwidth);
					pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
					pict.pictwidth = pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
					_debug('thin picture height: ' + pict.pictheight);
					_debug('thin picture width: ' + pict.pictwidth);
					document.getElementById('BigPict').style.marginTop = '0px';
					shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
					_debug('shiftLeft: ' + shift);
					document.getElementById('BigPict').style.marginLeft = shift + 'px';// - too short
				}
			} else {
				if ( win.width == 720 ) {
					_debug('original thick picture height: ' + pict.pictheight);
					_debug('original thick picture width: ' + pict.pictwidth);

					if ( (((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) - ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) % 1) < win.height ) {
						_debug('here++++++++++++++++++++++');
						pict.pictheight = ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) - ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
						pict.pictwidth = (pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1);//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
					} else {
						pict.pictheight = 576;
						_debug('pictureRealSize.height' + pictureRealSize.height);
						var tempcoef = (576 / pictureRealSize.height);
						_debug('tempcoef ' + tempcoef);
						_debug((pictureRealSize.width / xCoef) * tempcoef);
						pict.pictwidth = ((((pictureRealSize.width) * tempcoef) / 142) * 100) - ((((pictureRealSize.width) * tempcoef) / 142) * 100) % 1;

					}

					_debug('lower picture height: ' + pict.pictheight);
					_debug('lower picture width: ' + pict.pictwidth);
					shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
					_debug('shiftTop: ' + shift);
					document.getElementById('BigPict').style.marginTop = shift + 'px';// - too short
					document.getElementById('BigPict').style.marginLeft = ((win.width - pict.pictwidth) / 2) + 'px';
				} else {
					_debug('original thick picture height: ' + pict.pictheight);
					_debug('original thick picture width: ' + pict.pictwidth);
					pict.pictheight = pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
					pict.pictwidth = pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1;//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
					_debug('lower picture height: ' + pict.pictheight);
					_debug('lower picture width: ' + pict.pictwidth);
					shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
					_debug('shiftTop: ' + shift);
					document.getElementById('BigPict').style.marginTop = shift + 'px';// - too short
					document.getElementById('BigPict').style.marginLeft = '0px';
				}
			}
			document.getElementById('BigPict').style.height = pict.pictheight + 'px';
			document.getElementById('BigPict').style.width = pict.pictwidth + 'px';
			document.getElementById('BigPict').className = 'enlarge1';
			pictureSize = 1;
			break;
		case 0: //feet on(horisontal or vertical)
			if ( pictureSize ) {
				pictureSize = 0;
				document.getElementById('BigPict').className = 'enlarge0';
			}
			var shift = 0;
			if ( yCoef > xCoef ) {
				_debug('original thin picture height: ' + pict.pictheight);
				_debug('original thin picture width: ' + pict.pictwidth);
				pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
				pict.pictwidth = pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
				_debug('thin picture height: ' + pict.pictheight);
				_debug('thin picture width: ' + pict.pictwidth);
				document.getElementById('BigPict').style.marginTop = '0px';
				shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
				_debug('shiftLeft: ' + shift);
				document.getElementById('BigPict').style.marginLeft = shift + 'px';// - too short
			} else {
				_debug('original thick picture height: ' + pict.pictheight);
				_debug('original thick picture width: ' + pict.pictwidth);
				pict.pictheight = pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
				pict.pictwidth = pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1;//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
				_debug('lower picture height: ' + pict.pictheight);
				_debug('lower picture width: ' + pict.pictwidth);
				shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
				_debug('shiftTop: ' + shift);
				document.getElementById('BigPict').style.marginTop = (shift - (win.width / 70)) + 'px';// - too short
				document.getElementById('BigPict').style.marginLeft = '0px';
			}
			document.getElementById('BigPict').style.height = pict.pictheight + 'px';
			document.getElementById('BigPict').style.width = pict.pictwidth + 'px';
			break;
		case 1: //if ratio weird
			//pict.pictheight/pict.pictwidth - здесь лежит разрешение картинки после последнего преобразования
			//pictureRealSize.height/pictureRealSize.width - здесь хранится исходное разрешение картинки
			//shift - сдвиг по горизонтали или вертикали, в зависимости от того куда нам нужно переходить
			//yCoef/xCoef - отношения реальных размеров к нашим по вертикали и горизонтали
			if ( win.width == 720 ) {
				var shift = 0;
				if ( (yCoef > xCoef && yCoef < 1) || (yCoef < xCoef && yCoef > 1) ) {
					_debug('original thin picture height: ' + pict.pictheight);
					_debug('original thin picture width: ' + pict.pictwidth);
					if ( win.width == 720 ) {
						pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
						pict.pictwidth = (pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1) / 1.42 - ((pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1) / 1.42) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
						_debug('thin picture height: ' + pict.pictheight);
						_debug('thin picture width: ' + pict.pictwidth);
						document.getElementById('BigPict').style.marginTop = '0px';
						shift = ((win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1 - (win.width / 70));
						_debug('shiftLeft: ' + shift);
						document.getElementById('BigPict').style.marginLeft = shift + 'px';// - too short
					} else {
						_debug('original thin picture height: ' + pict.pictheight);
						_debug('original thin picture width: ' + pict.pictwidth);
						pict.pictheight = pictureRealSize.height / yCoef - (pictureRealSize.height / yCoef) % 1;//pict.pictheight/yCoef - (pict.pictheight/yCoef)%1;//
						pict.pictwidth = pictureRealSize.width / yCoef - (pictureRealSize.width / yCoef) % 1;//pict.pictwidth/yCoef - (pict.pictwidth/yCoef)%1;//
						_debug('thin picture height: ' + pict.pictheight);
						_debug('thin picture width: ' + pict.pictwidth);
						document.getElementById('BigPict').style.marginTop = '0px';
						shift = (win.width - pict.pictwidth) / 2 - ((win.width - pict.pictwidth) / 2) % 1;
						_debug('shiftLeft: ' + shift);
						document.getElementById('BigPict').style.marginLeft = shift + 'px';// - too short
					}
				} else {
					if ( win.width == 720 ) {
						_debug('original thick picture height: ' + pict.pictheight);
						_debug('original thick picture width: ' + pict.pictwidth);

						if ( (((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) - ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) % 1) < win.height ) {
							_debug('here++++++++++++++++++++++');
							pict.pictheight = ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) - ((pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1) * 1.42) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
							pict.pictwidth = (pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1);//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
						} else {
							pict.pictheight = 576;
							_debug('pictureRealSize.height' + pictureRealSize.height);
							var tempcoef = (576 / pictureRealSize.height);
							_debug('tempcoef ' + tempcoef);
							_debug((pictureRealSize.width / xCoef) * tempcoef);
							pict.pictwidth = ((((pictureRealSize.width) * tempcoef) / 142) * 100) - ((((pictureRealSize.width) * tempcoef) / 142) * 100) % 1;

						}

						_debug('lower picture height: ' + pict.pictheight);
						_debug('lower picture width: ' + pict.pictwidth);
						shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
						_debug('shiftTop: ' + shift);
						document.getElementById('BigPict').style.marginTop = shift + 'px';// - too short
						document.getElementById('BigPict').style.marginLeft = (((win.width - pict.pictwidth) / 2) - (win.width / 70)) + 'px';
					} else {
						_debug('original thick picture height: ' + pict.pictheight);
						_debug('original thick picture width: ' + pict.pictwidth);
						pict.pictheight = pictureRealSize.height / xCoef - (pictureRealSize.height / xCoef) % 1;//pict.pictheight/xCoef - (pict.pictheight/xCoef)%1;//
						pict.pictwidth = pictureRealSize.width / xCoef - (pictureRealSize.width / xCoef) % 1;//pict.pictwidth/xCoef - (pict.pictwidth/xCoef)%1;//
						_debug('lower picture height: ' + pict.pictheight);
						_debug('lower picture width: ' + pict.pictwidth);
						shift = (win.height - pict.pictheight) / 2 - ((win.height - pict.pictheight) / 2) % 1
						_debug('shiftTop: ' + shift);
						document.getElementById('BigPict').style.marginTop = shift + 'px';// - too short
						document.getElementById('BigPict').style.marginLeft = '0px';
					}
				}
				document.getElementById('BigPict').style.height = pict.pictheight + 'px';
				document.getElementById('BigPict').style.width = pict.pictwidth + 'px';
			}
			break;
	}
	_debug('current aspect = ' + aspect + ' height = ' + document.getElementById('BigPict').style.height + ' width =  ' + document.getElementById('BigPict').style.width);
	//document.getElementById('BigPict').style.height = pictheight+'px';
	//document.getElementById('BigPict').style.width = pictwidth+'px';
}

function changePict ( direction ) {
	_debug(curPictS);
	pictureRealSize.width = null;
	pictureRealSize.height = null;
	document.getElementById('pictureBig_0').innerHTML = '';
	document.getElementById('pictureBig_1').innerHTML = '';
	switch ( direction ) {
		case 'left':
			if ( curPictS != 0 ) {
				curPictS--;
				document.getElementById('pictureBig_0').innerHTML = '<img onload="resize();" id="BigPict"   src="' + searchResults[curPictS * 5 + 1] + '" alt="">';
				document.getElementById('pictureBig_0').style.display = 'block';
			} else {
				if ( searchPage ) {
					curPictS = (maxPictureLines * maxPictureColum - 1);
					searchPage--;
					getNextPage();
				}
			}
			break;
		case 'right':
			if ( curPictS != (maxPictureLines * maxPictureColum - 1) ) {
				curPictS++;
				document.getElementById('pictureBig_0').innerHTML = '<img onload="resize();" id="BigPict"   src="' + searchResults[curPictS * 5 + 1] + '" alt="">';
				document.getElementById('pictureBig_0').style.display = 'block';
			} else {
				curPictS = 0;
				searchPage++;
				getNextPage();
			}
			break;
	}
}

function getNextPage () {
	var url = document.getElementById('mainPage_holder_1').value;
	var searchLink = 'http://picasaweb.google.com/data/feed/base/all?kind=photo&alt=jsonc&v=2&start-index=' + (searchPage * maxPictureLines * maxPictureColum + 1) + '&max-results=' + (maxPictureLines * maxPictureColum) + '&q=' + url;
	getNPInfo(searchLink);
}

function getNPInfo ( url ) { //облегчённая версия запроса для получения следующей страницы результатов поиска когда мы просматриваем отдельные картинки
	keyEnabled = 0;
	var req_done = false;
	try {
		try { netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect"); } catch ( e ) {}
		var request = getXmlHttp();
		request.open('GET', url, true);
		request.setRequestHeader("Content-Type", "text/xml");
		request.setRequestHeader("charset", "utf-8");
		request.onreadystatechange = function () {
			if ( request.readyState == 4 && request.status == 404 ) {
				alert('wrong name or lost internet connection');
				exitToMain();
				drowFooter(0);
				document.getElementById('mainPage').style.display = 'block';
				return;
			}
			if ( request.readyState == 4 && request.status == 200 ) {
				req_done = true;
				var iframe = document.createElement('iframe');
				iframe.id = 'iframet';
				iframe.style.visibility = 'hidden';
				iframe.style.width = "0";
				iframe.style.height = "0";
				iframe.innerText = request.responseText;
				str = iframe.innerText;
				var req = /http:\/\/.{10,120}?\.jpg/igm;
				searchResults = str.match(req);
				_debug('current pict nomber: ' + curPictS * 5);
				_debug('and it cals: ' + searchResults[curPictS]);
				document.getElementById('pictureBig_0').innerHTML = '<img onload="resize();" id="BigPict"   src="' + searchResults[curPictS * 5 + 1] + '" alt="">';
				showResult(str, 1);
			}
			keyEnabled = 1;
		};
		request.send(null);
	} catch ( e ) { }
}

function empty ( mixed_var ) {
	if ( mixed_var === "" ||
		mixed_var === 0 ||
		mixed_var === "0" ||
		mixed_var === null ||
		mixed_var === false ||
		typeof mixed_var === 'undefined' ||
		typeof mixed_var === 'NaN'
	) {
		return true;
	}
	if ( typeof mixed_var == 'object' ) {
		for ( var key in mixed_var ) {return false;}
		return true;
	}
	return false;
}

function getJson ( puth, callback ) {
	var url,
		xhr = new XMLHttpRequest(),
		PATH_ROOT = location.pathname.split('/');
	PATH_ROOT[PATH_ROOT.length - 1] = '';
	PATH_ROOT = PATH_ROOT.join('/');
	PATH_ROOT = location.protocol + '//' + location.host + PATH_ROOT;
	url = PATH_ROOT + puth;
	xhr.onreadystatechange = function () {
		var jdata = null;
		if ( xhr.readyState === 4 ) {
			try {
				jdata = JSON.parse(xhr.responseText);
			} catch ( e ) {
				console.log(e);
				jdata = {};
			}
			if ( typeof callback === 'function' ) {
				callback(jdata);
			}
		}
	};
	xhr.open('GET', url, false);
	xhr.send();
	return xhr;
}
	