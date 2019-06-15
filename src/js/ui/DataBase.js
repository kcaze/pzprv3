// DataBase.js v3.4.0
/* global createEL:readonly, getEL:readonly */

//---------------------------------------------------------------------------
// ★ProblemDataクラス データベースに保存する1つのデータを保持する
//---------------------------------------------------------------------------
ui.ProblemData = function(){
	this.id = null;
	this.pdata = '';
	this.time = 0;

	if(arguments.length>0){ this.parse(arguments[0]);}
};
ui.ProblemData.prototype =
{
	updatePuzzleData : function(id){
		var puzzle = ui.puzzle, bd = puzzle.board;
		this.id = id;
		this.pdata = puzzle.getFileData(pzpr.parser.FILE_PZPR).replace(/\r?\n/g,"/");
		this.time = (pzpr.util.currentTime()/1000)|0;
		this.pid = puzzle.pid;
		this.col = bd.cols;
		this.row = bd.rows;
	},
	updateMetaData : function(){
		var metadata = new pzpr.MetaData(), form = document.database;
		metadata.comment = form.comtext.value;
		metadata.hard    = form.hard.value;
		metadata.author  = form.author.value;
		metadata.source  = form.source.value;
		var pzl = pzpr.parser(this.pdata);
		pzl.metadata.update(metadata);
		this.pdata = pzl.generate();
		return metadata;
	},
	getFileData : function(){
		return this.pdata.replace(/\//g,"\n");
	},
	toString : function(){
		var data = { id:this.id, pdata:this.pdata, time:this.time};
		return JSON.stringify(data);
	},
	parse : function(str){
		if(str===(void 0)){ this.id=null; return this;}
		var data = JSON.parse(str);
		for(var key in data){ this[key]=data[key];}
		var pzl = pzpr.parser(this.pdata);
		this.pid = pzl.pid;
		this.col = pzl.cols;
		this.row = pzl.rows;
		return this;
	}
};

//---------------------------------------------------------------------------
// ★Popup_DataBaseクラス データベース用ポップアップメニューの作成を行う
//---------------------------------------------------------------------------
ui.popupmgr.addpopup('database',
{
	formname : 'database',
	
	show : function(px,py){
		ui.popupmgr.popups.template.show.call(this,px,py);
		ui.database.openDialog();
	},
	close : function(){
		ui.database.closeDialog();
		ui.popupmgr.popups.template.close.call(this);
	},

	//---------------------------------------------------------------------------
	// database_handler() データベースmanagerへ処理を渡します
	//---------------------------------------------------------------------------
	database_handler : function(e){
		ui.database.clickHandler(e.target.name);
	}
});

//---------------------------------------------------------------------------
// ★DataBaseManagerクラス Web Storage用 データベースの設定・管理を行う
//---------------------------------------------------------------------------
ui.database = {
	dbh    : null,	// データベースハンドラ

	DBsid  : -1,	// 現在選択されているリスト中のID
	DBlist : [],	// 現在一覧にある問題のリスト

	sync   : false,	// 一覧がDataBaseのデータと合っているかどうかを表す

	update : function(){ ui.database.updateDialog();},

//	storageType : {},

	//---------------------------------------------------------------------------
	// dbm.openDialog()   データベースダイアログが開いた時の処理
	// dbm.closeDialog()  データベースダイアログが閉じた時の処理
	//---------------------------------------------------------------------------
	openDialog : function(){
		// データベースを開く
		this.dbh = new ui.DataBaseHandler_LS(this);
		this.sync = false;
		this.dbh.convert();
		this.dbh.importDBlist();
	},
	closeDialog : function(){
		this.DBlist = [];
	},

//	//---------------------------------------------------------------------------
//	// dbm.checkStorageType()  使用できるStorageの種類を取得
//	//---------------------------------------------------------------------------
//	checkStorageType : function(){
//		this.storageType = (function(){
//			var val = 0x00;
//			try{ if(!!window.sessionStorage){ val |= 0x10;}}catch(e){}
//			try{ if(!!window.localStorage)  { val |= 0x08;}}catch(e){}
//			try{ if(!!window.indexedDB)     { val |= 0x04;}}catch(e){}
//			try{ if(!!window.openDatabase){ // Opera10.50対策
//				var dbtmp = openDatabase('pzprv3_manage', '1.0', 'manager', 1024*1024*5);	// Chrome3対策
//				if(!!dbtmp){ val |= 0x02;}
//			}}catch(e){}
//			
//			// Firefox 8.0より前はローカルだとデータベース系は使えない
//			var Gecko = (UA.indexOf('Gecko')>-1 && UA.indexOf('KHTML')===-1);
//			var Gecko7orOlder = (Gecko && UA.match(/rv\:(\d+\.\d+)/) && +RegExp.$1<8.0); /* Firefox8.0よりも前 */
//			if(Gecko7orOlder && !location.hostname){ val = 0;}
//			
//			return {
//				session : !!(val & 0x10),
//				localST : !!(val & 0x08),
//				WebIDB  : !!(val & 0x04),
//				WebSQL  : !!(val & 0x02)
//			};
//		})();
//	}

	//---------------------------------------------------------------------------
	// dbm.clickHandler()  フォーム上のボタンが押された時、各関数にジャンプする
	//---------------------------------------------------------------------------
	clickHandler : function(name){
		if(this.sync===false){ return;}
		switch(name){
			case 'sorts'   : this.displayDataTableList();	// breakがないのはわざとです
			/* falls through */
			case 'datalist': this.selectDataTable(); break;
			case 'tableup' : this.upDataTable();     break;
			case 'tabledn' : this.downDataTable();   break;
			case 'open'    : this.openDataTable();   break;
			case 'save'    : this.saveDataTable();   break;
			case 'overwrite' : this.saveDataTable(); break;
			case 'updateinfo': this.updateInfo();    break;
			case 'del'     : this.deleteDataTable(); break;
		}
	},

	//---------------------------------------------------------------------------
	// dbm.getDataID()    選択中データの(this.DBlistのkeyとなる)IDを取得する
	// dbm.updateDialog() 管理テーブル情報やダイアログの表示を更新する
	//---------------------------------------------------------------------------
	getDataID : function(){
		var val = document.database.datalist.value;
		if(val!=="new" && val!==""){
			for(var i=0;i<this.DBlist.length;i++){
				if(this.DBlist[i].id==val){ return i;} // eslint-disable-line eqeqeq
			}
		}
		return -1;
	},
	updateDialog : function(){
		this.dbh.updateManageData();
		this.displayDataTableList();
		this.selectDataTable();
		this.sync = true;
	},

	//---------------------------------------------------------------------------
	// dbm.displayDataTableList() 保存しているデータの一覧を表示する
	// dbm.appendNewOption()      option要素を生成する
	// dbm.getRowString()         1データから文字列を生成する
	// dbm.dateString()           時刻の文字列を生成する
	//---------------------------------------------------------------------------
	displayDataTableList : function(){
		switch(document.database.sorts.value){
			case 'idlist' : this.DBlist = this.DBlist.sort(function(a,b){ return (a.id-b.id);}); break;
			case 'newsave': this.DBlist = this.DBlist.sort(function(a,b){ return (b.time-a.time || a.id-b.id);}); break;
			case 'oldsave': this.DBlist = this.DBlist.sort(function(a,b){ return (a.time-b.time || a.id-b.id);}); break;
			case 'size'   : this.DBlist = this.DBlist.sort(function(a,b){ return (a.col-b.col || a.row-b.row || a.id-b.id);}); break;
		}

		document.database.datalist.innerHTML = "";
		for(var i=0;i<this.DBlist.length;i++){
			var row = this.DBlist[i];
			if(!!row){ this.appendNewOption(row.id, this.getRowString(row));}
		}
		this.appendNewOption(-1, ui.selectStr("&nbsp;&lt;新しく保存する&gt;","&nbsp;&lt;New Save&gt;"));
	},
	appendNewOption : function(id, str){
		var opt = createEL('option');
		opt.setAttribute('value', (id!=-1 ? id : "new")); // eslint-disable-line eqeqeq
		opt.innerHTML = str;
		if(this.DBsid==id){ opt.setAttribute('selected', "selected");} // eslint-disable-line eqeqeq

		document.database.datalist.appendChild(opt);
	},
	getRowString : function(row){
		var str = "";
		str += ((row.id<10?"&nbsp;":"")+row.id+" :&nbsp;");
		str += (pzpr.variety(row.pid)[pzpr.lang]+"&nbsp;");
		str += (""+row.col+"×"+row.row+" &nbsp;");
		str += (pzpr.parser(row.pdata).metadata.hard+"&nbsp;");
		str += ("("+this.dateString(row.time*1000)+")");
		return str;
	},
	dateString : function(time){
		function ni(num){ return (num<10?"0":"")+num;}
		var date = new Date();
		date.setTime(time);
		return (ni(date.getFullYear()%100)+"/"+ni(date.getMonth()+1)+"/"+ni(date.getDate())+ " " +
				ni(date.getHours()) + ":" + ni(date.getMinutes()));
	},

	//---------------------------------------------------------------------------
	// dbm.selectDataTable() データを選択して、コメントなどを表示する
	//---------------------------------------------------------------------------
	selectDataTable : function(){
		var selected = this.getDataID(), form = document.database, item, metadata;
		if(selected>=0){
			item = this.DBlist[selected];
			metadata = pzpr.parser(item.pdata).metadata;
			getEL("database_cand").innerHTML = "";
		}
		else{
			item = new ui.ProblemData();
			item.updatePuzzleData(-1);
			metadata = ui.puzzle.metadata;
			getEL("database_cand").innerHTML = ui.selectStr("(新規保存)", "(Candidate)");
		}
		form.comtext.value = ""+metadata.comment;
		form.hard.value    = ""+metadata.hard;
		form.author.value  = ""+metadata.author;
		form.source.value  = ""+metadata.source;
		getEL("database_info").innerHTML = pzpr.variety(item.pid)[pzpr.lang] + "&nbsp;" + item.col+"×"+item.row +
										   "&nbsp;&nbsp;&nbsp;(" + this.dateString(item.time*1000) + ")";

		var sid = this.DBsid = +item.id; /* selected id */
		var sortbyid = (form.sorts.value==='idlist');
		form.tableup.disabled = (!sortbyid || sid===-1 || sid===1);
		form.tabledn.disabled = (!sortbyid || sid===-1 || sid===this.DBlist.length);
		form.updateinfo.disabled = (sid===-1);
		form.open.style.color = (sid===-1 ? "silver" : "");
		form.del.style.color  = (sid===-1 ? "silver" : "");
		form.save.style.display      = (sid===-1 ? "" : "none");
		form.overwrite.style.display = (sid===-1 ? "none" : "");
	},

	//---------------------------------------------------------------------------
	// dbm.upDataTable()      データの一覧での位置をひとつ上にする
	// dbm.downDataTable()    データの一覧での位置をひとつ下にする
	// dbm.convertDataTable() データの一覧での位置を入れ替える
	//---------------------------------------------------------------------------
	upDataTable : function(){
		var selected = this.getDataID();
		if(selected===-1 || selected===0){ return;}
		this.convertDataTable(selected, selected-1);
	},
	downDataTable : function(){
		var selected = this.getDataID();
		if(selected===-1 || selected===this.DBlist.length-1){ return;}
		this.convertDataTable(selected, selected+1);
	},
	convertDataTable : function(sid, tid){
		this.DBsid = this.DBlist[tid].id;

		/* idプロパティ以外を入れ替える */
		var id = this.DBlist[sid].id;
		this.DBlist[sid].id = this.DBlist[tid].id;
		this.DBlist[tid].id = id;
		var row = this.DBlist[sid];
		this.DBlist[sid] = this.DBlist[tid];
		this.DBlist[tid] = row;

		this.sync = false;
		this.dbh.saveItem(sid, tid);
	},

	//---------------------------------------------------------------------------
	// dbm.openDataTable()  データの盤面に読み込む
	// dbm.saveDataTable()  データの盤面を保存/上書きする
	//---------------------------------------------------------------------------
	openDataTable : function(){
		var id = this.getDataID(); if(id===-1){ return;}
		var filestr = this.DBlist[id].getFileData();
		ui.notify.confirm("このデータを読み込みますか？ (現在の盤面は破棄されます)",
						  "Recover selected data? (Current board is erased)",
						  function(){ ui.puzzle.open(filestr);});
	},
	saveDataTable : function(){
		var id = this.getDataID(), dbm = this;
		function refresh(){
			var list = dbm.DBlist, item = list[id];
			if(id===-1){ /* newSave */
				id = list.length;
				item = list[id] = new ui.ProblemData();
			}
			item.updatePuzzleData(id+1);
			var metadata = item.updateMetaData();
			ui.puzzle.metadata.update(metadata);
			dbm.DBsid = item.id;
			
			dbm.sync = false;
			dbm.dbh.saveItem(id);
		}
		
		if(id===-1){ refresh();}
		else       { ui.notify.confirm("このデータに上書きしますか？","Overwrite selected data?", refresh);}
	},

	//---------------------------------------------------------------------------
	// dbm.editComment()   データのコメントを更新する
	//---------------------------------------------------------------------------
	updateInfo : function(){
		var id = this.getDataID(); if(id===-1){ return;}

		this.DBlist[id].updateMetaData();

		this.sync = false;
		this.dbh.saveItem(id);
	},

	//---------------------------------------------------------------------------
	// dbm.deleteDataTable() 選択している盤面データを削除する
	//---------------------------------------------------------------------------
	deleteDataTable : function(){
		var id = this.getDataID(), dbm = this; if(id===-1){ return;}
		ui.notify.confirm("このデータを完全に削除しますか？","Delete selected data?", function(){
			var list = dbm.DBlist, sID = list[id].id, max = list.length;
			for(var i=sID-1;i<max-1;i++){ list[i] = list[i+1]; list[i].id--;}
			list.pop();

			dbm.sync = false;
			dbm.dbh.deleteItem(sID, max);
		});
	}
};

//---------------------------------------------------------------------------
// ★DataBaseHandler_LSクラス Web localStorage用 データベースハンドラ
//---------------------------------------------------------------------------
ui.DataBaseHandler_LS = function(parent){
	this.pheader = 'pzprv3_storage:data:';
	this.parent = parent;
	this.currentVersion = localStorage['pzprv3_storage:version'] || '0';

	this.createManageDataTable();
	this.createDataBase();
};
ui.DataBaseHandler_LS.prototype =
{
	//---------------------------------------------------------------------------
	// dbm.dbh.importDBlist()  DataBaseからDBlistを作成する
	//---------------------------------------------------------------------------
	importDBlist : function(){
		this.parent.DBlist = [];
		for(var i=1;true;i++){
			var row = new ui.ProblemData(localStorage[this.pheader+i]);
			if(row.id===null){ break;}
			this.parent.DBlist.push(row);
		}
		this.parent.update();
	},

	//---------------------------------------------------------------------------
	// dbm.dbh.createManageDataTable() 管理情報テーブルを作成する(消去はなし)
	// dbm.dbh.updateManageData()      管理情報レコードを更新する
	//---------------------------------------------------------------------------
	createManageDataTable : function(){
		localStorage['pzprv3_storage:version'] = '3.0';
	},
	updateManageData : function(){
		localStorage['pzprv3_storage:count'] = this.parent.DBlist.length;
		localStorage['pzprv3_storage:time']  = (pzpr.util.currentTime()/1000)|0;
	},

	//---------------------------------------------------------------------------
	// dbm.dbh.createDataBase()     テーブルを作成する
	//---------------------------------------------------------------------------
	createDataBase : function(){
	},

	//---------------------------------------------------------------------------
	// dbm.dbh.saveItem() databaseの指定されたIDを保存する
	//---------------------------------------------------------------------------
	saveItem : function(){
		var args = arguments;
		for(var i=0;i<args.length;i++){
			var item = this.parent.DBlist[args[i]];
			localStorage[this.pheader+item.id] = item.toString();
		}
		this.parent.update();
	},

	//---------------------------------------------------------------------------
	// dbm.dbh.deleteItem() 選択している盤面データを削除する
	//---------------------------------------------------------------------------
	deleteItem : function(sID, max){
		for(var i=+sID;i<max;i++){
			var data = new ui.ProblemData(localStorage[this.pheader+(i+1)]);
			data.id--;
			localStorage[this.pheader+i] = data.toString();
		}
		localStorage.removeItem(this.pheader+max);
		this.parent.update();
	},

	//---------------------------------------------------------------------------
	// dbm.dbh.convert() データ形式をコンバート
	//---------------------------------------------------------------------------
	convert : function(){
		if(!!localStorage['pzprv3_manage']) { this.convertfrom1();}
		else if(this.currentVersion==='2.0'){ this.convertfrom2();}
		this.currentVersion = '3.0';
	},
	hardstr : [
		{ja:'−'      , en:'-'     },
		{ja:'らくらく', en:'Easy'  },
		{ja:'おてごろ', en:'Normal'},
		{ja:'たいへん', en:'Hard'  },
		{ja:'アゼン'  , en:'Expert'}
	],
	convertfrom2 : function(){
		for(var i=1;true;i++){
			var item = new ui.ProblemData(localStorage[this.pheader+i]);
			if(item.id===null){ break;}
			var pzl = pzpr.parser(item.pdata);
			if(item.hard!='0'){ pzl.metadata.hard    = this.hardstr[item.hard][pzpr.lang];} // eslint-disable-line eqeqeq
			if(!!item.comment){ pzl.metadata.comment = item.comment;}
			item.pdata = pzl.generate();
			localStorage[this.pheader+i] = item.toString();
		}
	},
	convertfrom1 : function(){
		var keys=['id', 'col', 'row', 'hard', 'pdata', 'time', 'comment'];

		var timemax=0;
		delete localStorage['pzprv3_manage'];
		delete localStorage['pzprv3_manage:manage'];

		var puzzles = [];
		for(var pid in pzpr.variety.info){ // いらないのもあるけど、問題ないのでOK
			if(!localStorage['pzprv3_'+pid]){ continue;}
			var mheader = 'pzprv3_manage:manage!'+pid+'!';
			var count = localStorage[mheader+'count'];
			var ptime = localStorage[mheader+'time'];
			delete localStorage[mheader+'count'];
			delete localStorage[mheader+'time'];

			if(ptime > timemax){ ptime = timemax;}

			delete localStorage['pzprv3_'+pid];
			delete localStorage['pzprv3_'+pid+':puzdata'];
			for(var i=0;i<count;i++){
				var pheader = 'pzprv3_'+pid+':puzdata!'+(i+1)+'!';
				var row = new ui.ProblemData();
				for(var c=0;c<7;c++){
					row[keys[c]] = localStorage[pheader+keys[c]];
					delete localStorage[pheader+keys[c]];
				}
				var pzl = pzpr.parser(row.pdata);
				pzl.metadata.hard    = this.hardstr[row.hard][pzpr.lang];
				pzl.metadata.comment = row.comment;
				row.pdata = pzl.generate();
				delete row.hard;
				delete row.comment;
				delete row.col;
				delete row.row;
				puzzles.push(row);
			}
		}

		puzzles.sort(function(a,b){ return (a.time-b.time || a.id-b.id);});
		localStorage['pzprv3_storage:version'] = '3.0';
		localStorage['pzprv3_storage:count'] = puzzles.length;
		localStorage['pzprv3_storage:time']  = (pzpr.util.currentTime()/1000)|0;
		for(var i=0;i<puzzles.length;i++){
			puzzles[i].id = (i+1);
			localStorage['pzprv3_storage:data:'+(i+1)] = puzzles[i].toString();
		}
	}
};
