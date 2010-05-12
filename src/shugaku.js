//
// パズル固有スクリプト部 修学旅行の夜版 shugaku.js v3.3.1
//
Puzzles.shugaku = function(){ };
Puzzles.shugaku.prototype = {
	setting : function(){
		// グローバル変数の初期設定
		if(!k.qcols){ k.qcols = 10;}	// 盤面の横幅
		if(!k.qrows){ k.qrows = 10;}	// 盤面の縦幅
		k.irowake  = 0;		// 0:色分け設定無し 1:色分けしない 2:色分けする

		k.iscross  = 0;		// 1:盤面内側のCrossがあるパズル 2:外枠上を含めてCrossがあるパズル
		k.isborder = 0;		// 1:Border/Lineが操作可能なパズル 2:外枠上も操作可能なパズル
		k.isexcell = 0;		// 1:上・左側にセルを用意するパズル 2:四方にセルを用意するパズル

		k.isLineCross     = false;	// 線が交差するパズル
		k.isCenterLine    = false;	// マスの真ん中を通る線を回答として入力するパズル
		k.isborderAsLine  = false;	// 境界線をlineとして扱う
		k.hasroom         = false;	// いくつかの領域に分かれている/分けるパズル
		k.roomNumber      = false;	// 部屋の問題の数字が1つだけ入るパズル

		k.dispzero        = true;	// 0を表示するかどうか
		k.isDispHatena    = false;	// qnumが-2のときに？を表示する
		k.isAnsNumber     = false;	// 回答に数字を入力するパズル
		k.NumberWithMB    = false;	// 回答の数字と○×が入るパズル
		k.linkNumber      = false;	// 数字がひとつながりになるパズル

		k.BlackCell       = true;	// 黒マスを入力するパズル
		k.NumberIsWhite   = true;	// 数字のあるマスが黒マスにならないパズル
		k.RBBlackCell     = false;	// 連黒分断禁のパズル
		k.checkBlackCell  = true;	// 正答判定で黒マスの情報をチェックするパズル
		k.checkWhiteCell  = false;	// 正答判定で白マスの情報をチェックするパズル

		k.ispzprv3ONLY    = false;	// ぱずぷれアプレットには存在しないパズル
		k.isKanpenExist   = false;	// pencilbox/カンペンにあるパズル

		base.setTitle("修学旅行の夜","School Trip");
		base.setExpression("　マウスの左ボタンドラッグで布団を、右ボタンで通路を入力できます。",
						   " Left Button Drag to input Futon, Right Click to input aisle.");
		base.setFloatbgcolor("rgb(32, 32, 32)");
	},
	menufix : function(){ },

	//---------------------------------------------------------
	//入力系関数オーバーライド
	input_init : function(){
		// マウス入力系
		mv.mousedown = function(){
			if(k.playmode){
				if(this.btn.Left) this.inputFuton();
				else if(this.btn.Right) this.inputcell_shugaku();
			}
			else if(k.editmode){
				if(!kp.enabled()){ this.inputqnum();}
				else{ kp.display();}
			}
		};
		mv.mouseup = function(){
			if(k.playmode){
				if(this.btn.Left) this.inputFuton2();
			}
		};
		mv.mousemove = function(){
			if(k.playmode){
				if(this.btn.Left) this.inputFuton();
				else if(this.btn.Right) this.inputcell_shugaku();
			}
		};
		mv.inputFuton = function(){
			var cc = this.cellid();

			if(!this.firstPoint.valid()){
				if(cc===null || bd.QnC(cc)!==-1){ return;}
				this.mouseCell = cc;
				this.inputData = 1;
				this.firstPoint.set(this.inputPoint);
				pc.paintCell(cc);
			}
			else{
				var old = this.inputData;
				if(this.mouseCell===cc){ this.inputData = 1;}
				else{
					var dx=(this.inputPoint.x-this.firstPoint.x), dy=(this.inputPoint.y-this.firstPoint.y);
					if     (cc===null){ /* nop */ }
					else if(dx-dy>0 && dx+dy>0){ this.inputData = (bd.QnC(bd.rt(this.mouseCell))===-1?5:6);}
					else if(dx-dy>0 && dx+dy<0){ this.inputData = (bd.QnC(bd.up(this.mouseCell))===-1?2:6);}
					else if(dx-dy<0 && dx+dy>0){ this.inputData = (bd.QnC(bd.dn(this.mouseCell))===-1?3:6);}
					else if(dx-dy<0 && dx+dy<0){ this.inputData = (bd.QnC(bd.lt(this.mouseCell))===-1?4:6);}
				}
				if(old!=this.inputData){ pc.paintCellAround(this.mouseCell);}
			}
		};
		mv.inputFuton2 = function(){
			if(this.mouseCell===null){ return;}
			var cc = this.mouseCell

			this.changeHalf(cc);
			if(this.inputData!=1 && this.inputData!=6){ bd.sQaC(cc, 10+this.inputData); bd.sQsC(cc, 0);}
			else if(this.inputData==6){ bd.sQaC(cc, 11); bd.sQsC(cc, 0);}
			else{
				if     (bd.QaC(cc)==11){ bd.sQaC(cc, 16); bd.sQsC(cc, 0);}
				else if(bd.QaC(cc)==16){ bd.sQaC(cc, -1); bd.sQsC(cc, 1);}
//				else if(bd.QsC(cc)== 1){ bd.sQaC(cc, -1); bd.sQsC(cc, 0);}
				else                   { bd.sQaC(cc, 11); bd.sQsC(cc, 0);}
			}

			cc = this.getTargetADJ();
			if(cc!==null){
				this.changeHalf(cc);
				bd.sQaC(cc, {2:18,3:17,4:20,5:19}[this.inputData]); bd.sQsC(cc, 0);
			}

			cc = this.mouseCell;
			this.mouseCell = null;
			pc.paintCellAround(cc);
		};

		mv.inputcell_shugaku = function(){
			var cc = this.cellid();
			if(cc===null || cc===this.mouseCell || bd.QnC(cc)!==-1){ return;}
			if(this.inputData===null){
				if     (bd.QaC(cc)==1){ this.inputData = 2;}
				else if(bd.QsC(cc)==1){ this.inputData = 3;}
				else{ this.inputData = 1;}
			}
			this.changeHalf(cc);
			this.mouseCell = cc; 

			bd.sQaC(cc, (this.inputData==1?1:-1));
			bd.sQsC(cc, (this.inputData==2?1:0));

			pc.paintCellAround(cc);
		};

		mv.changeHalf = function(cc){
			var adj=null;
			if     (bd.QaC(cc)===12 || bd.QaC(cc)===17){ adj=bd.up(cc);}
			else if(bd.QaC(cc)===13 || bd.QaC(cc)===18){ adj=bd.dn(cc);}
			else if(bd.QaC(cc)===14 || bd.QaC(cc)===19){ adj=bd.lt(cc);}
			else if(bd.QaC(cc)===15 || bd.QaC(cc)===20){ adj=bd.rt(cc);}

			if     (adj===null){ /* nop */ }
			else if(bd.QaC(adj)>=12 && bd.QaC(adj)<=15){ bd.sQaC(adj,11);}
			else if(bd.QaC(adj)>=17 && bd.QaC(adj)<=20){ bd.sQaC(adj,16);}
		};
		mv.getTargetADJ = function(){
			if(this.mouseCell===null){ return null;}
			switch(this.inputData){
				case 2: return bd.up(this.mouseCell);
				case 3: return bd.dn(this.mouseCell);
				case 4: return bd.lt(this.mouseCell);
				case 5: return bd.rt(this.mouseCell);
			}
			return null;
		};
		mv.enableInputHatena = true;

		// キーボード入力系
		kc.keyinput = function(ca){
			if(k.playmode){ return;}
			if(this.moveTCell(ca)){ return;}
			this.key_inputqnum(ca);
		};

		if(k.EDITOR){
			kp.generate(4, true, false, '');
			kp.kpinput = function(ca){
				kc.key_inputqnum(ca);
			};
		}

		bd.maxnum = 4;

		menu.ex.adjustSpecial = function(key,d){
			switch(key){
			case this.FLIPY: // 上下反転
				for(var cc=0;cc<bd.cellmax;cc++){
					var val = {12:13,13:12,17:18,18:17}[bd.QaC(cc)];
					if(!isNaN(val)){ bd.cell[cc].qans = val;}
				}
				break;
			case this.FLIPX: // 左右反転
				for(var cc=0;cc<bd.cellmax;cc++){
					var val = {14:15,15:14,19:20,20:19}[bd.QaC(cc)];
					if(!isNaN(val)){ bd.cell[cc].qans = val;}
				}
				break;
			case this.TURNR: // 右90°反転
				for(var cc=0;cc<bd.cellmax;cc++){
					var val = {12:15,15:13,13:14,14:12,17:20,20:18,18:19,19:17}[bd.QaC(cc)];
					if(!isNaN(val)){ bd.cell[cc].qans = val;}
				}
				break;
			case this.TURNL: // 左90°反転
				for(var cc=0;cc<bd.cellmax;cc++){
					var val = {12:14,14:13,13:15,15:12,17:19,19:18,18:20,20:17}[bd.QaC(cc)];
					if(!isNaN(val)){ bd.cell[cc].qans = val;}
				}
				break;
			}
		}

		bd.sQaC = function(id, num){
			var old = this.cell[id].qans;
			um.addOpe(k.CELL, k.QANS, id, old, num);
			this.cell[id].qans = num;

			if(num===1 ^ area.bcell.id[id]!==null){
				area.setCell(id,(num===1?1:0));
			}
		};
	},

	//---------------------------------------------------------
	//画像表示系関数オーバーライド
	graphic_init : function(){
		pc.gridcolor = pc.gridcolor_LIGHT;
		pc.errbcolor1 = pc.errbcolor1_DARK;
		pc.bgcolor = "rgb(208, 208, 208)";
		pc.targetbgcolor = "rgb(255, 192, 192)";
		pc.circleratio = [0.44, 0.44];

		pc.paint = function(x1,y1,x2,y2){
			x1--; y1--; x2++; y2++;	// Undo時に跡が残ってしまう為

			this.drawRDotCells(x1,y1,x2,y2);
			this.drawDashedGrid(x1,y1,x2,y2);
			this.drawBlackCells(x1,y1,x2,y2);

			this.drawFutons(x1,y1,x2,y2);
			this.drawFutonBorders(x1,y1,x2,y2);

			this.drawTargetFuton(x1,y1,x2,y2);

			this.drawCirclesAtNumber(x1,y1,x2,y2);
			this.drawNumbers(x1,y1,x2,y2);

			this.drawChassis(x1,y1,x2,y2);

			this.drawTarget(x1,y1,x2,y2);
		};

		pc.drawFutons = function(x1,y1,x2,y2){
			this.vinc('cell_back', 'crispEdges');

			var header = "c_full_";
			var clist = bd.cellinside(x1,y1,x2,y2);
			for(var i=0;i<clist.length;i++){
				var c = clist[i];
				if(bd.cell[c].qans>=11){
					g.fillStyle = (bd.cell[c].error===1 ? this.errbcolor1 : "white");
					if(this.vnop(header+c,this.FILL)){
						g.fillRect(bd.cell[c].px+1, bd.cell[c].py+1, this.cw-1, this.ch-1);
					}
				}
				else{ this.vhide(header+c);}

				this.drawPillow1(c, (bd.cell[c].qans>=11 && bd.cell[c].qans<=15), false);
			}
		};
		pc.drawPillow1 = function(cc, flag, inputting){
			var mgnw = this.cw*0.15;
			var mgnh = this.ch*0.15;
			var header = "c_pillow_"+cc;

			if(flag){
				g.lineWidth = 1;
				g.strokeStyle = "black";
				if     (inputting)            { g.fillStyle = this.targetbgcolor;}
				else if(bd.cell[cc].error===1){ g.fillStyle = this.errbcolor1;   }
				else                          { g.fillStyle = "white";}

				if(this.vnop(header,this.FILL)){
					g.shapeRect(bd.cell[cc].px+mgnw+1, bd.cell[cc].py+mgnh+1, this.cw-mgnw*2-1, this.ch-mgnh*2-1);
				}
			}
			else{ this.vhide([header]);}
		};

		pc.drawFutonBorders = function(x1,y1,x2,y2){
			this.vinc('border_futon', 'crispEdges');

			var lw = this.lw, lm = this.lm;
			var doma1 = {11:1,12:1,14:1,15:1,16:1,17:1,19:1,20:1};
			var domb1 = {11:1,13:1,14:1,15:1,16:1,18:1,19:1,20:1};
			var doma2 = {11:1,12:1,13:1,14:1,16:1,17:1,18:1,19:1};
			var domb2 = {11:1,12:1,13:1,15:1,16:1,17:1,18:1,20:1};
			var header = "b_bd";
			g.fillStyle = "black";

			for(var by=Math.min(bd.minby+1,y1-2),maxy=Math.max(bd.maxby-1,y2+2);by<=maxy;by++){
				for(var bx=Math.min(bd.minbx+1,x1-2),maxx=Math.max(bd.maxbx-1,x2+2);bx<=maxx;bx++){
					if(!((bx+by)&1)){ continue;}
					var a = bd.QaC( bd.cnum(bx-(by&1), by-(bx&1)) );
					var b = bd.QaC( bd.cnum(bx+(by&1), by+(bx&1)) );
					var vid = [header,bx,by].join("_");

					if     ((bx&1) && !(isNaN(doma1[a])&&isNaN(domb1[b]))){
						if(this.vnop(vid,this.NONE)){
							g.fillRect(k.p0.x+(bx-1)*this.bw-lm, k.p0.x+by*this.bh-lm, this.cw+lw, lw);
						}
					}
					else if((by&1) && !(isNaN(doma2[a])&&isNaN(domb2[b]))){
						if(this.vnop(vid,this.NONE)){
							g.fillRect(k.p0.x+bx*this.bw-lm, k.p0.x+(by-1)*this.bh-lm, lw, this.ch+lw);
						}
					}
					else{ this.vhide(vid);}
				}
			}
		};

		pc.drawTargetFuton = function(x1,y1,x2,y2){
			var cc = mv.mouseCell;
			var inputting = (cc!==null && mv.firstPoint.valid());

			if(inputting){
				this.vinc('cell_back', 'crispEdges');

				// 入力中ふとんの背景カラー描画
				var header = "c_full_";
				g.fillStyle = this.targetbgcolor;

				if(cc!==null){
					if(this.vnop(header+cc,this.FILL)){
						g.fillRect(bd.cell[cc].px+1, bd.cell[cc].py+1, this.cw-1, this.ch-1);
					}
				}
				else{ this.vhide(header+cc);}

				var adj=mv.getTargetADJ();
				if(adj!==null){
					if(this.vnop(header+adj,this.FILL)){
						g.fillRect(bd.cell[adj].px+1, bd.cell[adj].py+1, this.cw-1, this.ch-1);
					}
				}
				else{ this.vhide(header+adj);}

				// 入力中ふとんのまくら描画
				this.drawPillow1(cc,true,true);

				// 入力中ふとんの下になるまくらを消す
				if(!g.use.canvas && adj!==null){ this.drawPillow1(adj,false,true);}

				// 入力中ふとんの周りの境界線描画
				this.vinc('border_futon', 'crispEdges');

				this.vdel(["tbd1_","tbd2_","tbd3_","tbd4_"]);
				var lw = this.lw, lm = this.lm;
				var bx1 = (adj===null?bd.cell[cc].bx:Math.min(bd.cell[cc].bx,bd.cell[adj].bx));
				var by1 = (adj===null?bd.cell[cc].by:Math.min(bd.cell[cc].by,bd.cell[adj].by));
				var px = k.p0.x+(bx1-1)*this.bw, py = k.p0.y+(by1-1)*this.bh;
				var wid = (mv.inputData===4||mv.inputData===5?2:1)*this.cw;
				var hgt = (mv.inputData===2||mv.inputData===3?2:1)*this.ch;

				g.fillStyle = "black";
				if(this.vnop("tbd1_",this.NONE)){ g.fillRect(px-lm    , py-lm    , wid+lw, lw);}
				if(this.vnop("tbd2_",this.NONE)){ g.fillRect(px-lm    , py-lm    , lw, hgt+lw);}
				if(this.vnop("tbd3_",this.NONE)){ g.fillRect(px+wid-lm, py-lm    , lw, hgt+lw);}
				if(this.vnop("tbd4_",this.NONE)){ g.fillRect(px-lm    , py+hgt-lm, wid+lw, lw);}

				// 入力中ふとんの間の太線を消す
				if(!g.use.canvas && cc!==null && adj!==null){
					var bx = (bd.cell[cc].bx+bd.cell[adj].bx)/2;
					var by = (bd.cell[cc].by+bd.cell[adj].by)/2;
					this.vhide([["b_bd",bx,by].join("_")]);
				}
			}
			else{
				// 入力中でない時は周りの境界線を消す
				this.vinc('border_futon', 'crispEdges');
				this.vdel(["tbd1_","tbd2_","tbd3_","tbd4_"]);
			}
		};
	},

	//---------------------------------------------------------
	// URLエンコード/デコード処理
	encode_init : function(){
		enc.pzlimport = function(type){
			this.decodeShugaku();
		};
		enc.pzlexport = function(type){
			this.encodeShugaku();
		};

		enc.decodeShugaku = function(){
			var c=0, bstr = this.outbstr;
			for(var i=0;i<bstr.length;i++){
				var ca = bstr.charAt(i);
				if     (ca>='0' && ca<='4'){ bd.sQnC(c, parseInt(ca,36)); c++;}
				else if(ca=='5')           { bd.sQnC(c, -2);              c++;}
				else{ c += (parseInt(ca,36)-5);}
				if(c>=bd.cellmax){ break;}
			}
			this.outbstr = bstr.substr(i);
		};
		enc.encodeShugaku = function(){
			var cm="", count=0;
			for(var i=0;i<bd.cellmax;i++){
				var pstr = "";
				var val = bd.QnC(i);

				if     (val==-2){ pstr = "5";}
				else if(val!=-1){ pstr = val.toString(36);}
				else{ count++;}

				if(count==0){ cm += pstr;}
				else if(pstr || count==30){ cm+=((5+count).toString(36)+pstr); count=0;}
			}
			if(count>0){ cm+=(5+count).toString(36);}
			this.outbstr += cm;
		};

		//---------------------------------------------------------
		fio.decodeData = function(){
			this.decodeCell( function(c,ca){
				if(ca == "5")     { bd.sQnC(c, -2);}
				else if(ca == "#"){ bd.sQaC(c, 1);}
				else if(ca == "-"){ bd.sQsC(c, 1);}
				else if(ca>="a" && ca<="j"){ bd.sQaC(c, parseInt(ca,20)+1);}
				else if(ca != "."){ bd.sQnC(c, parseInt(ca));}
			});
		};
		fio.encodeData = function(){
			this.encodeCell( function(c){
				if     (bd.QnC(c)>=0) { return (bd.QnC(c).toString() + " ");}
				else if(bd.QnC(c)==-2){ return "5 ";}
				else if(bd.QaC(c)==1) { return "# ";}
				else if(bd.QaC(c)>=0) { return ((bd.QaC(c)-1).toString(20) + " ");}
				else if(bd.QsC(c)==1) { return "- ";}
				else                  { return ". ";}
			});
		};
	},

	//---------------------------------------------------------
	// 正解判定処理実行部
	answer_init : function(){
		ans.checkAns = function(){

			if( !this.checkKitamakura() ){
				this.setAlert('北枕になっている布団があります。', 'There is a \'Kita-makura\' futon.'); return false;
			}

			if( !this.check2x2Block( bd.isBlack ) ){
				this.setAlert('2x2の黒マスのかたまりがあります。', 'There is a 2x2 block of black cells.'); return false;
			}

			if( !this.checkAllCell(ee.binder(this, function(c){ return (bd.QnC(c)>=0 && bd.QnC(c)<this.checkdir4Cell(c,function(a){ return (bd.QaC(a)>=11&&bd.QaC(a)<=15);}));})) ){
				this.setAlert('柱のまわりにある枕の数が間違っています。', 'The number of pillows around the number is wrong.'); return false;
			}

			if( !this.checkAllCell(function(c){ return (bd.QaC(c)==11||bd.QaC(c)==16);}) ){
				this.setAlert('布団が2マスになっていません。', 'There is a half-size futon.'); return false;
			}

			if( !this.checkFutonAisle() ){
				this.setAlert('通路に接していない布団があります。', 'There is a futon separated to aisle.'); return false;
			}

			if( !this.checkOneArea( area.getBCellInfo() ) ){
				this.setAlert('黒マスが分断されています。', 'Aisle is divided.'); return false;
			}

			if( !this.checkAllCell(ee.binder(this, function(c){ return (bd.QnC(c)>=0 && bd.QnC(c)>this.checkdir4Cell(c,function(a){ return (bd.QaC(a)>=11&&bd.QaC(a)<=15);}));})) ){
				this.setAlert('柱のまわりにある枕の数が間違っています。', 'The number of pillows around the number is wrong.'); return false;
			}

			if( !this.checkAllCell(function(c){ return (bd.QnC(c)==-1 && bd.QaC(c)==-1);}) ){
				this.setAlert('布団でも黒マスでもないマスがあります。', 'There is an empty cell.'); return false;
			}

			return true;
		};

		ans.checkKitamakura = function(){
			var result = true;
			for(var c=0;c<bd.cellmax;c++){
				if(bd.QaC(c)==13){
					if(this.inAutoCheck){ return false;}
					bd.sErC([c,bd.dn(c)],1);
					result = false;
				}
			}
			return result;
		};

		ans.checkFutonAisle = function(){
			var result = true;
			for(var c=0;c<bd.cellmax;c++){
				if(bd.QnC(c)==-1 && bd.QaC(c)>=12 && bd.QaC(c)<=15){
					var adj=null;
					switch(bd.QaC(c)){
						case 12: adj = bd.up(c); break;
						case 13: adj = bd.dn(c); break;
						case 14: adj = bd.lt(c); break;
						case 15: adj = bd.rt(c); break;
					}
					if( this.checkdir4Cell(c  ,function(a){ return (bd.QaC(a)==1)})==0 &&
						this.checkdir4Cell(adj,function(a){ return (bd.QaC(a)==1)})==0 )
					{
						if(this.inAutoCheck){ return false;}
						bd.sErC([c,adj],1);
						result = false;
					}
				}
			}
			return result;
		};
	}
};
