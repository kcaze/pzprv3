
our $debug = 0;
our $filech = 1;
our $version = 'v3.2.3';

&main();
exit(0);

sub main{
	&input_flags();

	if($filech==1){
		if(!$debug){
			&eraseLOG();
			&printLOG("pzprBase.js $version contents\n");
		}

		&output_pzprBase();
		if(!$debug){
			&output_puzzles(); # contents.txtにファイル名出力するだけ
		}
	}
	elsif($filech==2){
		&output_puzzles();
	}
}

sub input_flags{
	print "どのファイルを出力しますか？ 1:pzprBase.js 2:puzzles.js [1] ";
	$_ = <STDIN>; tr/\r\n//d;
	if(/2/){ $filech=2;}

	print "リリース用のファイルを出力しますか？[y] ";
	$_ = <STDIN>; tr/\r\n//d;
	if(/n/i){ $debug=1;}

	print "バージョンを入力してください[$version] ";
	$_ = <STDIN>; tr/\r\n//d;
	if($_){
		$version = $_;
		$version =~ s/\[a\]/α/g;
		$version =~ s/\[b\]/β/g;
	}
}

sub output_pzprBase{
	my @files = (
		'global.js',
		'Board.js',
		'Graphic.js',
		'MouseInput.js',
		'KeyInput.js',
		'Encode.js',
		'Filesys.js',
		'Answer.js',
		'Undo.js',
		'Menu.js',
		'MenuExec.js',
		'pzprUtil.js',
		'Main.js'
	);

	open OUT, ">pzprBase_body_Full.js";
	if($debug){
		print OUT "// pzplBase.js テスト用\n";
	}
	print OUT "\nvar pzprversion=\"$version\";\n";
	&printfiles(\@files,1);
	close OUT;

	if(!$debug){
		&output_doc("notices.txt");

		system("java -jar ../../../yuicompressor-2.4.2/build/yuicompressor-2.4.2.jar -o ./pzprBase_body.js ./pzprBase_body_Full.js");
		system("copy /Y /B .\\notices.txt + .\\pzprBase_body.js ..\\pzprBase.js");
		system("copy /Y /B .\\notices.txt + .\\pzprBase_body_Full.js ..\\pzprBase_Full.js");

		unlink("notices.txt");
		unlink("pzprBase_body.js");
		unlink("pzprBase_body_Full.js");
	}
	else{
		system("copy /Y .\\pzprBase_body_Full.js ..\\pzprBase.js");
		unlink("pzprBase_body_Full.js");
	}
}

sub output_puzzles{
	my @files = ();
	opendir PAR, "../";
	while(my $file = readdir PAR){
		if($file !~ /\.js$/){ next;}
		if($file =~ /p\d+\.js$/){ next;}
		if($file =~ /pzprBase/){ next;}
		if($file =~ /puzzles/){ next;}
		if($file =~ /uuCanvas\.js/){ next;}
		if($file =~ /excanvas\.js/){ next;}
		if($file =~ /jquery\.js/){ next;}
		if($file =~ /Prototype\.js/){ next;}
		if($file =~ /gears_init\.js/){ next;}
		if($file =~ /for_test\.js/){ next;}

		push @files, "../$file";
	}
	closedir PAR;
	if($filech==1){
		&printfiles(\@files,3);
		return;
	}

	open OUT, ">puzzles_Full.js";
	&printfiles(\@files,2);
	close OUT;

	if(!$debug){
		system("java -jar ../../../yuicompressor-2.4.2/build/yuicompressor-2.4.2.jar -o ./puzzles.js ./puzzles_Full.js");

		system("copy /Y .\\puzzles.js ..");
		system("copy /Y .\\puzzles_Full.js ..");

		unlink("puzzles.js");
		unlink("puzzles_Full.js");
	}
	else{
		system("copy /Y .\\puzzles_Full.js ..\\puzzles.js");
		unlink("puzzles_Full.js");
	}
}

sub output_doc{
	my $file = shift;
	my @dates = localtime(time);
	my $datestr = sprintf("%04d-%02d-%02d",1900+$dates[5],1+$dates[4],$dates[3]);

	open DOC, ">$file";

	print DOC <<"EOR";
/* 
 * pzprBase.js
 * 
 * pzprBase.js is a base script for playing nikoli puzzles on Web
 * written in JavaScript.
 * 
 * \@author  happa.
 * \@version $version
 * \@date    $datestr
 * 
 * This script uses following libraries.
 *  jquery.js (version 1.3.2)
 *  http://jquery.com/
 *  uuCanvas.js (version 1.0)
 *  http://code.google.com/p/uupaa-js-spinoff/	uupaa.js SpinOff Project Home(Google Code)
 * 
 * For improvement of canvas drawing time, I make some change on uuCanvas.js.
 * Please see "//happa add.[20090608]" in uuCanvas.js.
 * 
 * This script is dual licensed under the MIT and Apache 2.0 licenses.
 * http://indi.s58.xrea.com/pzpr/v3/LICENCE.HTML
 * 
 */
EOR
	close DOC;
}

# ファイル出力関数
sub printfiles{
	my @files = @{$_[0]};
	my $type = $_[1];

	if(!$debug){ &printLOG("\n");}

	foreach(@files){
		my $filename = $_;

		if($debug){
			print OUT "document.writeln(\"<script type=\\\"text/javascript\\\" src=\\\"src/pzprBase/$_\\\"></script>\");\n";
			next;
		}

		# header部の処理 => バージョンを取得する
		if($type!=2){
			my @val = &get_version($filename, $type);
			&printLOG(sprintf("%-14s %-s\n",@val));

			# $typeが3なら、バージョンだけ書き出して終了
			if($type==3){ next;}
		}

		# 実際の出力部
		open SRC, $filename;
		{
			if($type==1){ <SRC>;}	# pzprBaseのファイルはヘッダ部を出力しない

			# 変換をかけたい場合は、、この中に変換処理を入れるべし
			while(<SRC>){
				my $sline = $_;
				print OUT $sline;
			}
		}
		close SRC;
	}
}

# バージョン取得用関数
sub get_version{
	my($filename, $type) = @_;
	my $sline = '';
	my @ret = ();

	open SRC, $filename;
	# pzprBaseフォルダのファイルはversionが1行目
	if($type == 1){
		$_ = <SRC>;
		/\/\/ +([^ ]+) +([^ \r\n]+)[\r\n]*/;
		@ret = ($1,$2);
	}
	# puzzlesのファイルはversionが2行目
	elsif($type == 3){
		<SRC>; $_ = <SRC>;
		/(\w+\.js) +([^ \r\n]+)[\r\n]*/;
		@ret = ($1,$2);
	}
	close SRC;

	return @ret;
}

sub eraseLOG{
	open LOG, ">contents.txt";
	close LOG;
}
sub printLOG{
	open LOG, ">>contents.txt";
	printf(LOG $_[0]);
	close LOG;
}
