(function(vizana, $, undefined){

// public
vizana.servelet = "http://172.27.183.11:8080/REtoServlet/ReHttpServlet";
vizana.title = "EXTERNAL <big>IPs</big>";
vizana.xvalue = "no. of events";


// private
var w = window.innerWidth,
h = window.innerHeight,
p = 10,
selected = "b4",
showFrom = 0,
currentbar = -1,
currentbarend = -1,
barsData = [],
pagesize = 20,
maxCount,
quadrantValues,
ranks,
graph,
getDataStack = 0,
dataStackCallback = function(){},
loaded = false;

// public methods
vizana.init = function()
{
	setupPage();

	// 2 inside getdata stack
	getDataStack = 4;
	
	var param = {"VOid":1, "Type":1, "Mode":0, "Param":"SELECT max(Count) FROM test_table;"};
	vizana.addQuery(param, function(data){maxCount=data[""][0]["max(Count)"];});
	
	param = {"VOid":1, "Type":1, "Mode":0, "Param":"SELECT min(Rank),max(Rank) FROM test_table GROUP BY Percentile ORDER BY Percentile;"};
	vizana.addQuery(param, function(data){ranks=data[""];});
		
	param = {"VOid":1, "Type":1, "Mode":0, "Param":"SELECT max(Count) FROM test_table GROUP BY Percentile ORDER BY Percentile;"};
	vizana.addQuery(param, function(data){quadrantValues=data[""];});
		
	param = {"VOid":1, "Type":1, "Mode":0, "Param":"SELECT Count FROM test_table ORDER BY Rank;"};
	vizana.addQuery(param, function(data){graph=data[""];});
	
	vizana.Query(initData, true);

};


// private methods
function initData()
{
	setupCSS();
	setupText();
	setupGraph();
	setupListener();
	$(window).resize(resize);

	setupSelect(selected);

}

function resize()
{
	setupCSS();
	setupGraph();
	setupSelect(selected);
}

function setupText()
{
	$("#title span").html(vizana.title);
	$("#q0 span").html(0);
	$("#q1 span").html(quadrantValues[0]["max(Count)"]);
	$("#q2 span").html(quadrantValues[1]["max(Count)"]);
	$("#q3 span").html(quadrantValues[2]["max(Count)"]);
	$("#q4 span").html(quadrantValues[3]["max(Count)"]);
	$("#xvalue span").html(vizana.xvalue).css({"padding":2, "font-size": "18px"});
}

function setupListener()
{
	$(".quad").click(quadClick);
	$("#contentfooter").click(nextClick);
}

function nextClick()
{
	setupBars(showFrom-5);
}

function quadClick(event)
{
	var id = this.id;

	$(".anim").hide("puff","fast");
	$(".bar").hide("slide","fast");

	$(".anim").promise().done(function(){
		selected = id;
		setupSelect(id);
		$(".anim").show("puff","fast");
	});
}

function getID(id)
{
	return id.charAt(id.length-1);
}



function getBarsData(from)
{
	$("#spinner").show("fade","slow");

	currentbar = from - pagesize;
	currentbarend = from + 4 + pagesize;

	var param = {"VOid":1, "Type":1, "Mode":0, "Param":"SELECT Rank, Count FROM test_table WHERE Rank >= "+currentbar+" AND Rank <= "+currentbarend+";"};
	vizana.jsonP(param, refreshAndSaveData);
}

function updateBarsData(dir)
{
	// redraw stuff before updating the data in memory
	refreshBars(barsData);
	currentbar += dir*pagesize;
	currentbarend += dir*pagesize;
	
	var param = {"VOid":1, "Type":1, "Mode":0, "Param":"SELECT Rank, Count FROM test_table WHERE Rank >= "+currentbar+" AND Rank <= "+currentbarend+";"};
		
	// update data
	vizana.jsonP(param, saveData);
	
}

function refreshAndSaveData(data, textStatus, jqXHR)
{	
	saveData(data, textStatus, jqXHR);
	refreshBars(barsData, textStatus, jqXHR);
}

function saveData(data, textStatus, jqXHR)
{
	barsData = data[""];

}

function refreshBars(data, textStatus, jqXHR)
{	
	var y = h/2+100, barh = (h-y-p-18-7*10)/5;
	var m = maxCount;
	var start = showFrom - currentbar;
	
	var barw = 0;
	var mw = w - 10*p;
	var code = "";
	var count = 0;
	
	for (var i=start, len=start-5; i>len; i--)
	{		
		barw = mw * data[i]["Count"]/m;
		code += '<div class="bar" style="position:absolute;top:'+((barh+10)*count+10)+'px;left:10px;width:'+barw+'px;height:'+barh+'px;">'+data[i]["Count"]+' events</div>';
		count++;
	}
	
	$("#bars").html(code).css("font-size",(barh*0.7)+"px");
	
	$(".loading").hide("fade","slow");
	$(".bar").show("slide","slow");

}

function setupBars(from)
{	
	showFrom = from;

	var left = currentbar - (from-4),
	right = showFrom - currentbarend;

	// if outside the barsData, redo everything
	if (left > 0 || right > 0)
	{
		getBarsData(showFrom);
	}
	// if at the border region of barsData, show the bars then start retrieving a new set of data
	else if (left > - pagesize/2)
	{
		updateBarsData(-1);
	}
	else if (right > - pagesize/2)
	{
		updateBarsData(1);
	}
	else
	{
		refreshBars(barsData);
	}
}

function setupSelect(id)
{
	var x = $("#"+id).offset().left,
	y = $("#"+id).offset().top,
	qh = $("#"+id).height(),
	qw = $("#"+id).width(),
	x1,y1,x2,y2,xx,yy;

	var canvas = document.getElementById("selected");
	canvas.width = w;
	canvas.height = h;
	
	var ctx = canvas.getContext("2d");
	/*
	$("#contentselected").css({	
		"position":"absolute",
		"top": y, 
		"left": x,
		"width": qw-1,
		"height": qh+30+25+18
	});
	*/
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "rgba(154,83,75,0.3)";
	ctx.beginPath();
	xx = x;
	yy = y;
	ctx.moveTo(xx,yy);
	xx += qw;
	ctx.lineTo(xx,yy);
	yy += qh;
	ctx.lineTo(xx,yy);
	x1 = xx;
	y1 = yy + 50;
	xx = w-p;
	yy += 100;
	x2 = xx;
	y2 = y1;
	ctx.bezierCurveTo(x1,y1,x2,y2,xx,yy);  
	yy = h-p;
	ctx.lineTo(xx,yy);
	xx = p;
	ctx.lineTo(xx,yy);
	yy = y+qh+100;
	ctx.lineTo(xx,yy);
	x1 = xx;
	y1 = yy - 50;
	xx = x;
	yy = y+qh;
	x2 = xx;
	y2 = y1;
	ctx.bezierCurveTo(x1,y1,x2,y2,xx,yy);  
	xx= x;
	yy = y;
	ctx.lineTo(xx,yy);
	ctx.closePath();
	ctx.fill();
	
	showFrom = ranks[getID(id)-1]["max(Rank)"];
	setupBars(showFrom);
}

function setupGraph()
{
	var bh = $("#graph").height();

	var canvas = document.getElementById("graph");
	canvas.width = w - p - p;
	canvas.height = bh;
	
	var ctx = canvas.getContext("2d"),
	quadWidth = canvas.width/4,
	qh = canvas.height; 

	ctx.lineWidth = 1;
	ctx.strokeStyle = "#000000";
	ctx.fillStyle = "rgb(227,196,163)";  
	ctx.beginPath();
	ctx.moveTo(0,qh);
	drawGraph(0, canvas.width, qh, ctx, graph,"Count");
	//drawQ(0, quadWidth, qh, ctx, vizana.q1);
	//drawQ(quadWidth, quadWidth, qh, ctx, vizana.q2);
	//drawQ(quadWidth*2, quadWidth, qh, ctx, vizana.q3);
	//drawQ(quadWidth*3, quadWidth, qh, ctx, vizana.q4);
	ctx.lineTo(quadWidth*4,qh);
	ctx.lineTo(0,qh);
	ctx.closePath();
	ctx.stroke();
	ctx.fill();
}

function drawQ(startX, quadWidth, qh, ctx, q)
{
	var len = q.length,
	step = quadWidth/len;
	for (var i=0; i<len; i++)
	{
		ctx.lineTo(startX+(i+1)*step,(1-q[i])*qh);
	}
}

function drawGraph(startX, quadWidth, qh, ctx, q, index)
{
	var len = q.length,
	step = quadWidth/len;
	for (var i=0; i<len; i++)
	{
		ctx.lineTo(startX+(i+1)*step,(1-q[i][index]/maxCount)*qh);
	}
}

function setupPage()
{
	var codes =	vizana.DIVwithSPAN("title");
	codes += vizana.DIVwithSPAN("q0","header");
	codes += vizana.DIVwithSPAN("q1","header");
	codes += vizana.DIVwithSPAN("q2","header");
	codes += vizana.DIVwithSPAN("q3","header");
	codes += vizana.DIVwithSPAN("q4","header");
	codes += vizana.DIVwithSPAN("c0","footer");
	codes += vizana.DIVwithSPAN("c1","footer");
	codes += vizana.DIVwithSPAN("c2","footer");
	codes += vizana.DIVwithSPAN("c3","footer");
	codes += vizana.DIVwithSPAN("c4","footer");
	codes += vizana.DIVwithSPAN("xvalue","footer");
	codes += vizana.DIV("b1","quad");
	codes += vizana.DIV("b2","quad");
	codes += vizana.DIV("b3","quad");
	codes += vizana.DIV("b4","quad");
	codes += vizana.DIV("bars","anim");
	codes += vizana.DIV("contentfooter","anim");
	codes += vizana.DIV("spinner","loading");
	codes += vizana.DIV("bgspinner","loading");
	codes += vizana.CANVAS("graph");
	codes += vizana.CANVAS("selected", "anim");

	$("#container").html(codes);
}

function setupCSS()
{
	w = window.innerWidth;
	h = window.innerHeight;
	
	var tmpx = p, tmpy = p, qw = (w-p-p)/4, bh = (h-60-18-p-p/2-p)/2 - 25, dh;
	
	$("#title").css({ 	"position":"absolute",
						"top": p, 
						"left": p,
						"width": w-p-p,
						"height": 60					
						});
						
	tmpy += 60+p/2;
	
	$("#q0").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw/2,
						"height": 18
						
						});
	
	tmpx+=qw/2;
	
	$("#q1").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw,
						"height": 18,
						"text-align": "center"
						});
	tmpx+=qw;

						
	$("#q2").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw,
						"height": 18,
						"text-align": "center"				
						});
	tmpx+=qw;

	$("#q3").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw,
						"height": 18,
						"text-align": "center"				
						});
	tmpx+=qw;


	$("#q4").css({ 	"position":"absolute",
						"top": tmpy, 
						"right": p,
						"width": qw/2+p,
						"height": 18,
						"text-align": "right"
						});
	tmpx=p;
	tmpy+=18;
		
	$("#graph").css({ "position":"absolute",
						"top": tmpy, 
						"right": p,
						"width": w-p-p,
						"height": bh,
						});	
						
	$("#selected").css({ 
		"position":"absolute",
		"top": 0, 
		"right": 0,
		"width": w,
		"height": h,
	});	
	
	$("#b1").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw-p/2,
						"height": bh				
						});
	

	tmpx += qw+p/4;

	$("#b2").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw-p/2,
						"height": bh				
						});
	

	tmpx += qw+p/4;

	$("#b3").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw-p/2,
						"height": bh				
						});
	

	tmpx += qw+p/4;

	$("#b4").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw-p/2,
						"height": bh				
						});
	
	tmpx = p;
	tmpy += bh;

	$("#c0").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw/2,
						"height": 18
						
						});
	
	tmpx+=qw/2;
	
	$("#c1").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw,
						"height": 18,
						"text-align": "center"
						});
	tmpx+=qw;

						
	$("#c2").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw,
						"height": 18,
						"text-align": "center"				
						});
	tmpx+=qw;

	$("#c3").css({ 	"position":"absolute",
						"top": tmpy, 
						"left": tmpx,
						"width": qw,
						"height": 18,
						"text-align": "center"				
						});
	tmpx+=qw;

	$("#c4").css({ 	"position":"absolute",
						"top": tmpy, 
						"right": p,
						"width": qw/2+p,
						"height": 18,
						"text-align": "right"
						});

	tmpx = p;
	tmpy += 18;
	

	$("#xvalue").css({ 	"position":"absolute",
						"top": tmpy, 
						"right": p,
						"width": w-p-p,
						"height": 25,
						"text-align": "right"
						
						});
		
	tmpx = p;
	tmpy += 25 + 50;
	dh = h - tmpy - p - 18;
						
	$("#bars").css({ "position":"absolute",
						"top": tmpy, 
						"right": p,
						"width": w-p-p,
						"height": dh+1,
						});
	
	tmpy += dh;
		
	$("#contentfooter").css({ "position":"absolute",
						"top": tmpy, 
						"right": p,
						"width": w-p-p,
						"height": 18,
						});
						
	

						
}




}( window.vizana = window.vizana || {}, jQuery) );