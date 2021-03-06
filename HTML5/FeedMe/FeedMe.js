(function(feedme) {

var anim = 0, pig = [], dollars, f = 0, fd = 1, fa = 0.5, x = 0, y = 0, tx = 0, ty = 0, v = 20, iw = 64, ih = 64, t = false, food = [], w, h, ran = true, lastT = new Date().getTime(),
vx = 0,vy = 0;

feedme.init = function(fullscreen)
{
	var scripts = document.getElementsByTagName("script"),
	src = scripts[scripts.length-1].src;

	src = src.substring(0, src.lastIndexOf("/"));
	
    var canvas = document.getElementById('feedmeCanvas'),
	ctx = canvas.getContext('2d');
	
	if (fullscreen)
	{
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}
	
    w = canvas.width;
    h = canvas.height; 
	
	ctx.setTransform(1, 0, 0, 1, 0, 0);

	x = (w-iw)/2;
	y = (h-ih)/2;
	
	
	pig.push(new Image());
	pig[0].onload = function(){
        ctx.drawImage(pig[0], x, y, iw, ih);
    };
    pig[0].src = src+"/pig.png";

	pig.push(new Image());
    pig[1].src = src+"/pig2.png";

	
	dollars = new Image();
    dollars.src = src+"/dollars.png";

	canvas.addEventListener( 'click', Click, false );

	
    window.setInterval(Update, 30);
};


var Click = function(event) {

    var canvas = document.getElementById('feedmeCanvas'),
	ctx = canvas.getContext('2d'),	
	mx = event.offsetX || (event.clientX - canvas.offsetLeft),
	my = event.offsetY || (event.clientY - canvas.offsetTop);
	food.push(mx);
	food.push(my);
}


var MovePig = function(dt){

	dt /= 1000.0;
	
	if (iw > 24)
	{
		iw -= dt;
		ih -= dt;
	}
	
	if (food.length<=0 && ran === true)
	{
		tx = iw + Math.random() * (w-2*iw);
		ty = ih + Math.random() * (h-2*ih);
		ran = false;
	}
	
	var dx = tx - x,
	dy = ty - y,
	n = dx*dx+dy*dy;

	n = Math.sqrt(n);
	
	if (n <= iw)
	{
		ran = true;
	}
	
	n = 1/n;
	n *= v * dt;
	
	dx *= n;
	dy *= n;
	
	x += dx;
	y += dy;
	
	f += fd*fa;
	if (f >= 5) 
	{
		fd *= -1;
		if (anim == 0) anim = 1;
		else anim = 0;
	}
	else if (f <= -5)
	{
		fd *= -1;
	}
	
	
}


var Update = function(){

	var canvas = document.getElementById('feedmeCanvas'),
	ctx = canvas.getContext('2d'),
	dw = dollars.width/2,
	dh = dollars.height/2,
	dmin = w*w+h*h,
	d = 0,
	dd =0,
	min = [],
	sumx = 0,
	sumy = 0,
	thre = iw*iw/4;
	
	ctx.save();
	ctx.setTransform(w, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, w, h);
	ctx.restore();

	ctx.save();
	
	for (var i=0, len=food.length; i<len; i+=2)
	{
		ctx.drawImage(dollars, food[i]-dw, food[i+1]-dh);
		
		var dx = food[i] - x,
		dy = food[i+1] - y,
		ll = dx*dx+dy*dy;
		
		if (ll <= thre)
		{
			min.push(i);
		}
		
		ll = (dmin-len)/ll;
		
		sumx += ll * dx;
		sumy += ll * dy;
	}
	
	for(var i=0, len=min.length; i<len; i++)
	{
		food.splice(min[i],2);
		ih += 2;
		iw += 2;
	}
	
	ctx.restore();
	
	ctx.save();
	ctx.translate(x, y+ih/2);
	ctx.rotate(f*Math.PI/180);
	ctx.translate(-x, -y-ih/2);
	ctx.drawImage(pig[anim], x-iw/2, y-ih/2, iw, ih);
	ctx.restore();

	if (food.length > 0)
	{
		tx = sumx + 0.1*vx;
		ty = sumy + 0.1*vy;
		vx = tx;
		vy = ty;
		ran = true;
	}		

	var nowT = new Date().getTime();
	MovePig(nowT-lastT);
	
	lastT = nowT;
};

var GetPowerOfTwo = function(value, pow) {
	var pow = pow || 1;
	while(pow<value) {
		pow *= 2;
	}
	return pow;
};


var GetPigImage = function(width, height){

	var pigCanvas = document.createElement("canvas"),
	ctx = pigCanvas.getContext('2d'),
	w = Math.max(GetPowerOfTwo(width/5),64),
	h = Math.max(GetPowerOfTwo(height/5),64),
	r = Math.max(w,h)/2,
	t = 2,
	r1 = r-2*t,
	r2 = r1/2;
		
	pigCanvas.width = w;
	pigCanvas.height = h;
	
	ctx.fillStyle="#FAAFBA";
	ctx.beginPath();
	ctx.arc(w/2,h/2,r1,0,Math.PI*2,true);
	ctx.closePath();
	ctx.fill();

	ctx.fillStyle="#FFFFFF";
	ctx.beginPath();
	ctx.arc(w/2-r2,h/2,r2,0,Math.PI*2,true);
	ctx.closePath();
	ctx.fill();

	ctx.fillStyle="#FFFFFF";
	ctx.beginPath();
	ctx.arc(w/2+r2,h/2,r2,0,Math.PI*2,true);
	ctx.closePath();
	ctx.fill();

	return ctx.getImageData(0,0,w,h);
};


}(window.feedme = window.feedme || {}));