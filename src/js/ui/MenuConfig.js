// MenuConfig.js v3.4.1
/* global pzpr:false, ui:false */

(function(){
//---------------------------------------------------------------------------
// ★MenuConfigクラス UI側の設定値を管理する
//---------------------------------------------------------------------------
var Config = pzpr.Puzzle.prototype.Config.prototype;

// メニュー描画/取得/html表示系
// Menuクラス
ui.menuconfig = {

	list : null,			// MenuConfigの設定内容を保持する

	//---------------------------------------------------------------------------
	// menuconfig.init()  MenuConfigの初期化を行う
	// menuconfig.add()   初期化時に設定を追加する
	//---------------------------------------------------------------------------
	init : function(){
		this.list = {};
		
		this.add('autocheck',      ui.puzzle.playeronly);	/* 正解自動判定機能 */
		this.add('autocheck_once', ui.puzzle.playeronly);	/* 正解自動判定機能 */
		this.list.autocheck_once.volatile = true;
		
		this.add('keypopup', false);						/* キーポップアップ (数字などのパネル入力) */
		this.add('keyboard', false);						/* 盤面をキー入力のターゲットにする */

		this.add('adjsize', true);							/* 自動横幅調節 */
		this.add('cellsizeval', 36);						/* セルのサイズ設定用 */
		this.add('fullwidth', (ui.windowWidth()<600));		/* キャンバスを横幅いっぱいに広げる */
		
		this.add('toolarea', 1, [0,1]);						/* ツールエリアの表示 */
	},
	add : Config.add,

	//---------------------------------------------------------------------------
	// menuconfig.get()  各フラグの設定値を返す
	// menuconfig.set()  各フラグの設定値を設定する
	//---------------------------------------------------------------------------
	get : Config.get,
	set : function(idname, newval){
		if(!this.list[idname]){ return;}
		newval = this.setproper(idname, newval);
		this.configevent(idname,newval);
	},

	//---------------------------------------------------------------------------
	// menuconfig.getList()  現在有効な設定値のリストを返す
	//---------------------------------------------------------------------------
	getList : Config.getList,
	getexec : function(name){ return true;},

	//---------------------------------------------------------------------------
	// menuconfig.getAll()  全フラグの設定値を返す
	// menuconfig.setAll()  全フラグの設定値を設定する
	//---------------------------------------------------------------------------
	getAll : Config.getAll,
	setAll : function(setting){
		Config.setAll.call(this, setting);
		this.list.autocheck_once.val = this.list.autocheck.val;
	},

	//---------------------------------------------------------------------------
	// menuconfig.setproper()    設定値の型を正しいものに変換して設定変更する
	// menuconfig.valid()        設定値が有効なパズルかどうかを返す
	//---------------------------------------------------------------------------
	setproper : Config.setproper,
	valid : function(idname){
		if(idname==="keypopup"){ return (ui.keypopup.paneltype[1]!==0 || ui.keypopup.paneltype[3]!==0);}
		return !!this.list[idname];
	},

	//---------------------------------------------------------------------------
	// config.configevent()  設定変更時の動作を記述する
	//---------------------------------------------------------------------------
	configevent : function(idname, newval){
		ui.setdisplay(idname);
		switch(idname){
		case 'keypopup':
			ui.keypopup.display();
			break;
			
		case 'keyboard':
			ui.misc.setkeyfocus();
			break;
			
		case 'adjsize': case 'cellsizeval': case 'fullwidth':
			ui.adjustcellsize();
			break;
			
		case 'autocheck':
			this.list.autocheck_once.val = newval;
			break;
		}
	}
};

})();