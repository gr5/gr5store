
function doit()
{
  location.href="/wp/cart/?add-to-cart=44,59";
}

var fratios = [];
var fratios_subset=[];

class laser_lens
{
  constructor(_laser_type, _lens_fl, _minfr, _maxfr, _price, _notes="")
  {
    this.laser_type = _laser_type;
    this.lens_fl    = _lens_fl;
    this.minfr      = _minfr;
    this.maxfr      = _maxfr;
    this.notes      = _notes;
    this.price      = _price;
  }
  
  reset()
  {
    this.mirrors="";
    this.qtyMirrorsNeed=0;
    this.minMirror=1000; // fratio
  }

  addMirror(f)
  {
    ll.mirrors+=f+" ";
    ll.qtyMirrorsNeed++;
    if (f < this.minMirror) 
      this.minMirror=f;
  }  

  
  inrange(fr)
  {
    return (fr >= this.minfr && fr <= this.maxfr);
  }
  
  laserImagePath()
  {
    if (this.laser_type == "reg")
      return gr_theme_path+"las_norm.jpg";
    else
      return gr_theme_path+"las_glass.jpg";
  }

  laserPretty()
  {
    if (this.laser_type == "reg") return "Regular";
    if (this.laser_type == "glass") return "Glass";
    return this.laser_type;
  }
}

class cost_summer
{
  constructor(_ll)
  {
    this.ll = _ll;
  }
  
  reset()
  {
    this.xyz="kit"; // other options: assy metal plastic none
    this.bAssembled=false;
    this.bSkipDivergers=false;
    this.bSkipCube=false;
    this.bSkipFlat=false;
    this.bSkipIFPlastic=false;
    this.bSkipLaser=false;
    this.bGlassLaser=false;
    this.laser="1.7"; // 1.7 means regular laser.  2.6 means glass laser
  }
  
  get_cost()
  {
    var sum=0;

    switch (this.xyz)
    {
      case 'metal':
        sum+=gr_prices['xyz_metal'];
        break;
      case 'plastic':
        sum+=gr_prices['xyz_plastic'];
        break;
      case 'kit':
        sum+=gr_prices['xyz_kit'];
        break;
      case 'assy':
        sum+=gr_prices['xyz_asm'];
        break;
      case 'none':
        // do nothing
    }

    if (this.bSkipCube==false) sum+=gr_prices['cube'];
    if (this.bSkipFlat==false) sum+=gr_prices['flat'];
    if (this.bSkipIFPlastic==false) sum+=gr_prices['if'];
    
    if (this.bSkipLaser==false)
    {
       switch(this.laser)
       {
         case "2.6":
           sum+=gr_prices['laser26'];
           break;
         case "1.7":
         default:
           sum+=gr_prices['laser17'];
         
       }
    }
    
    // now lenses
    var edmunds_sum=0;
    var bNothingFound=true;
    for (j=0; j < laser_lens_combos.length; j++)
    {
      ll = laser_lens_combos[j];
      if (ll.qtyMirrorsNeed > 0)
      {
        bNothingFound=false;
        if (ll.notes.indexOf("Edmund") !== -1)
          edmunds_sum += ll.price;
        else
          sum += ll.price
      }
    }
    
    if (bNothingFound)
      sum+=gr_prices['lens13']; // assume they will eventually choose at least one diverger so pick a cheap one for estimate

    var ret = "$"+sum;
    if (edmunds_sum > 0)
      ret+=" (doesn't include $"+edmunds_sum+" for 3rd party lenses)";
    return ret;
  }
}

function gr_hide_graph()
{
  document.getElementById('gr_shim').style.display="none";
  document.getElementById('gr_msgbox').style.display="none";
}

function gr_show_graph()
{
  var t=  document.getElementById('gr_msgbox');
  var str="";
  str+="<div style='position: absolute; top:10px; right: 10px'>";
  str+="<a href='javascript:gr_hide_graph()'>X Close</a></div>";
  str+="<p>";
  str+="Look up your mirror on the graph below (this assumes parabolic mirrors - spherical mirrors aren't";
  str+=" a problem and can be any size).  Mirrors on the red line are quite difficult.  You should definitely";
  str+=" get the glass laser as you will need super clean optics.  But mirrors on the red line are possible.";
  str+=" However below the red line - I'm not sure how far you can go. I heard hearsay (someone said that someone said) that someone was able to test a mirror on the black line with a Bath Interferometer.";
  str+=" Contact me if your mirror is on or below the red line.  I will suggest better optics.  Also there are other options such as a Ross Null.";
  
  str+="<img src='"+gr_theme_path+"Z8curve.png' style='width: 100%;'>";
  str+="&nbsp;<a href='javascript:gr_hide_graph()'>X Close</a>";
  
  
  t.innerHTML=str;
  t.style.display="block";
  document.getElementById('gr_shim').style.display="block";

}




function willLaserHandle(laser_type)
{
    // can we handle all focal ratios with this laser?
    for (i=0; i < fratios_subset.length; i++)
    {
      fratio = fratios_subset[i];
      for (j=0; j < laser_lens_combos.length; j++)
      {
        ll = laser_lens_combos[j];
        if (ll.laser_type == laser_type && ll.inrange(fratio))
          break; // handled
      }
      if (j==laser_lens_combos.length)return false;
    }
    return true;
}

function ll_resetAll()
{
  for (j=0; j < laser_lens_combos.length; j++)
  {
    laser_lens_combos[j].reset();
  }
}


function selectLenses(laser_type_in)
{
    // assumes laser_lens_combos is sorted 
    // 
    for (i=0; i < fratios_subset.length; i++)
    {
      fratio = fratios_subset[i];
      for (j = laser_lens_combos.length-1; j>=0; j--)
      {
        ll = laser_lens_combos[j];
        if ( (ll.laser_type == laser_type_in || laser_type_in=="") && ll.inrange(fratio))
        {
          ll.addMirror(fratio);
          break; // check next mirror
        }
      }
    }
}

function maxMirrorForF(f)
{
  // convert f to a mirror diameter based on assuming Z8 term of 10 waves is maximum we can do
  var diam = 10*8*.2496*f*f*f;
  var digits = (diam<254) ? 1 : 0;
  return (diam/25.4).toFixed(digits)+" in ("+diam.toFixed(0)+" mm)";
}

function display_chosen(div_id)
{
  //
  // get first laser-lens combo to figure out which laser we are working with here
  //
  var j;
  var bFound=false;
  for (j=0; j < laser_lens_combos.length; j++)
  {
    ll = laser_lens_combos[j];
    if (ll.qtyMirrorsNeed > 0)
    {
      bFound=true;
      break;
    }
  }
  if (bFound==false)
    return; // nothing to display
  
  var str="<table style='font-size:0.7rem'>";
  str+="<tr><td colspan=3><div style='vertical-align: middle'>";
  str+=ll.laserPretty()+" laser<img src='"+ll.laserImagePath()+"' width=50 style='vertical-align:middle'>";
  str+=" <input type=button value='continue' id='"+div_id+"btn"+"'>";
  str+="<span id='"+div_id+"spn'></span></div></td></tr>";
  str+="<tr><th>Lens</th>";
  str+="<th>Lens works with<br>Mirror F/#</th><th>Max Mirror<br>Diameter ";
  str+="<a href='javascript:gr_show_graph();'>(help)</a>";
  str+="</th></tr>\n";


  for (j=0; j < laser_lens_combos.length; j++)
  {
    ll = laser_lens_combos[j];
    if (ll.qtyMirrorsNeed > 0)
    {
      str+="<tr><td>\n";
      str+=ll.lens_fl+"mm "+ll.notes+"</td><td>"+ll.mirrors+"</td>";
      str+="<td>"+maxMirrorForF(ll.minMirror)+"</td></tr>\n";
      bFirst=false;
    }
  }
  str+="</table>";
  var t = document.getElementById(div_id);
  t.innerHTML = str;
}


function gr_addF()
{
  var f = document.getElementById('gr_fnum').value;
  gr_add_f(f);
}

function gr_add_f(f)
{
    f = parseFloat(f);
    if (isNaN(f))
      return; // not a number
    if (f <= 0)
      return;

    var i;
    for (i=0; i<fratios.length; ++i)
    {
      if (fratios[i] == f)
        return; // already have this one
    }
    fratios.push(f);
    fratios.sort(function(a, b) {return a-b;});
    
    gr_update_fs();
}

function save_cookie(name, value)
{
  var expires = (new Date(Date.now()+ 86400*365)).toUTCString(); // one year
  document.cookie=name+"="+value+";expires="+expires+";path=/;";
}

const getCookieValue = (name) => (
  document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)

function gr_update_fs()
{
  t = document.getElementById('gr_spn_sofar');
  if (!t)
    return;
  if (fratios.length==0)
  {
    t.innerHTML="";
    save_cookie("grf",""); // delete cookie contents
    choose_optics();
    return;
  }
  
  
  var i;
  var s="";
  var c="";
  for (i=0; i<fratios.length; ++i)
  {
     s+="F/"+fratios[i]+"&nbsp;&nbsp;";
     c+=fratios[i]+",";
  }
  t.innerHTML="So far: <b>"+s+"</b> <font size=-1><a href='javascript:gr_clear_f();'>clear</a></font>";
  save_cookie("grf",c);
  choose_optics();
}

function gr_clear_f()
{
  fratios=[];
  gr_update_fs();
}

function gr_go()
{
  // must be sorted by minimum F/# column
  laser_lens_combos.push( new laser_lens("glass", 7.65, 1.8, 4.4, gr_prices['lens765']) );
  laser_lens_combos.push( new laser_lens("glass", 9,    2.6, 5.2, gr_prices['lens9']) );
  laser_lens_combos.push( new laser_lens("reg",   7.65, 3.3, 6.6, gr_prices['lens765']) );
  laser_lens_combos.push( new laser_lens("reg",   9,    3.6, 7.2, gr_prices['lens9']) );
  laser_lens_combos.push( new laser_lens("glass", 13,   3.7, 7.4, gr_prices['lens13']) );
  laser_lens_combos.push( new laser_lens("reg",   13,   4.7, 10, gr_prices['lens13']) );

  // edmunds lenses
  laser_lens_combos.push( new laser_lens("glass", 18,   6.1, 10, 26, "(Edmund Optics 32-966)") ); // f/5 minimum.  6.1 chosen to give priority to 13mm lens
  laser_lens_combos.push( new laser_lens("reg",   18,   8,  15,  26, "(Edmund Optics 32-966)") );
  laser_lens_combos.push( new laser_lens("glass", 30,   8.5, 15, 26, "(Edmund Optics 45-133)") );
  laser_lens_combos.push( new laser_lens("glass", 40,   10, 20,  27, "(Edmund Optics 63-540)") );
  laser_lens_combos.push( new laser_lens("reg",   30,   13, 25,  26, "(Edmund Optics 45-133)") );
  laser_lens_combos.push( new laser_lens("reg",   40,   17, 34,  27, "(Edmund Optics 63-540)") );


  var x = document.getElementsByClassName("entry-content");
  var i;
  var bFound=false;
  for (i = 0; i < x.length; i++) 
  {
    t=x[i];
    if (t.innerHTML.indexOf("We sell Bath")>0)
    {
      bFound=true;
      break;
    }
  }
  if (!bFound) return;
  //alert(t.innerHTML);
  x="<font color=red>This page is not done so please </font>  <a href='https://thegr5store.com/wp/?product_cat=bath'>click here to shop.</a> Although you are welcome to play with this page.<p>";

  x+="Use this page to help you pick out an inexpensive Bath Interferometer. ";
  x+="<br>";
  x+="Step 1 - choose laser and diverger<br>\n";
  x+="Please enter F/#'s of a mirror you want to test. Then press enter or click add button until you have listed them all.<br>\n";
  x+="example   4    for f/4 <br>\n";
  x+="F/#&nbsp;";
  x+="<input type='text' id='gr_fnum' value=6 size=2";
  x+=" onkeydown = 'if (event.keyCode==13)gr_addF()' style='width:auto' >";
  x+="<input type='button' value='add' onclick='gr_addF()'><br>\n";
  x+="<span id='gr_spn_sofar'></span><br>\n";
  x+="<span id='idCost'></span><br>\n";
  x+="<div id='idOptics1'></div>\n";
  x+="<div id='idOptics2'></div>\n";
  x+="<div id='idOptics3'></div>\n";
  x+="<div id='idOptics4'></div>\n";
  x+="<div id='gr_shim' style=\"";
      x+="display:none;";
      x+="opacity: .75;";
      x+="filter: alpha(opacity=75);";
      x+="-ms-filter: 'alpha(opacity=75)';";
      x+="-khtml-opacity: .75;";
      x+="-moz-opacity: .75;";
      x+="background: #B8B8B8;";
      x+="position: absolute;";
      x+="left: 0px;";
      x+="top: 0px;";
      x+="height: 100%;";
      x+="width: 100%;";
      x+="z-index:990;";
  x+="\"></div>\n";
  
  
  x+="<div id='gr_msgbox' style='display:none;";
      x+="position: absolute;";
      x+="left: 5%;";
      x+="top: 5%;";
      x+="width: 90%;";
      x+="padding: 10px 10px 10px 10px;";
      x+="background: #fff;";
      x+="border: 1px solid #ccc;";
      x+="box-shadow: 3px 3px 7px #777;";
      x+="-webkit-box-shadow: 3px 3px 7px #777;";
      x+="-moz-border-radius: 22px;";
      x+="-webkit-border-radius: 22px;";
      x+="z-index:999;";
  x+="'></div>\n";
  
/*

  x+="<p><input type='button' value='add multiple items to cart' onclick='doit()'>";
  x+="<p>pretty if price: "+gr_pretty_price['if']+"<p>";
  x+= "cart items: "+cart_items+"<p>";
  x+= gr_img_cube;
  
  */
  
  t.innerHTML += x;
  gr_load_cookies();
  gr_update_fs();
 
  choose_optics();
  
}

var laser_lens_combos = [];


var inst_cost_summer = new cost_summer(laser_lens_combos); // inst=instance



var result="";


function gr_load_cookies()
{
  //alert("v2");
  var c = getCookieValue("grf");
  if (!c) return;
  var ary = c.split(",");
  for(var i=0; i<ary.length; i++)
  {
    gr_add_f(ary[i]);
  }
}

function update_cost_step1(laser_type)
{
    inst_cost_summer.reset();
    if (laser_type=="glass")
      inst_cost_summer.laser="2.6";
    var cost = inst_cost_summer.get_cost();
    document.getElementById('idCost').innerHTML = "Expected cost: "+cost;
}

function choose_optics()
{
    ll_resetAll();
    
    fratios_subset = fratios.slice(); // make a copy

    
    var t = document.getElementById("idOptics1");
    t.innerHTML="";
    document.getElementById("idOptics2").innerHTML="";
    document.getElementById("idOptics3").innerHTML="";
    document.getElementById("idOptics4").innerHTML="";

    if (fratios_subset.length==0)return;
    
    var result="";

    // check for mirrors not in the ranges
    for (i=0; i < fratios_subset.length; i++)
    {
      fratio = fratios_subset[i];
      if (fratio < laser_lens_combos[0].minfr)
      {
        result+="<font color='red'>F/"+fratio+" mirror (less than F/"+laser_lens_combos[0].minfr+
                ") is pretty extreme - please contact us about testing this mirror</font><br>";
        fratios_subset.splice(i,1); // remove this one from the array
        i--;
      }
      else if (fratio > laser_lens_combos[laser_lens_combos.length-1].maxfr)
      {
        result+="<font color='red'>F/"+fratio+" mirror (greater than F/"+laser_lens_combos[laser_lens_combos.length-1].maxfr+
                ") will need a longer focal length lens than I normally sell but these are available - please contact us about testing this mirror</font><br>";
        fratios_subset.splice(i,1); // remove this one from the array
        i--;
      }
    }



    if (willLaserHandle("reg"))
    {
      selectLenses("reg");
      display_chosen("idOptics2");
      document.getElementById('idOptics2btn').value="Continue with these parts";
      document.getElementById('idOptics2btn').onClick="gr_cont('reg')";
      update_cost_step1("reg");
      if (willLaserHandle("glass"))
      {
        ll_resetAll();
        selectLenses("glass");
        document.getElementById("idOptics3").innerHTML = 
          "<p>Or alternatively get the nicer laser and these lenses:";
        display_chosen("idOptics4");
        // get extra cost of glass laser
        var extra_cost = "$"+(gr_prices['laser26'] - gr_prices['laser17']);
        
        document.getElementById('idOptics2btn').value="Choose this laser";
        document.getElementById('idOptics2spn').innerHTML=
            "<br>This laser should be fine for your needs";

        document.getElementById('idOptics4btn').value="Choose this laser ("+extra_cost+" more)";
        document.getElementById('idOptics4btn').onClick="gr_cont('glass')";
        document.getElementById('idOptics4spn').innerHTML=
            "<br>This laser has a glass focusing lens which is easier to take out and clean";
        
      }
    }
    else
    {
      selectLenses("glass");
      display_chosen("idOptics2");
      document.getElementById('idOptics2btn').value="Continue with these parts";
      document.getElementById('idOptics2btn').onClick="gr_cont('glass')";
      update_cost_step1("glass");
    }


    t.innerHTML = result;
    

    /*
                 min max
    glass  7.65  2.2 4.4
    glass  9     2.6 5.2
    reg    7.65  3.3 6.6
    reg    9     3.6 7.2
    glass 13     3.7 7.4
    reg   13     4.7 10

    1) Try to resolve all with reg laser
    if not
    2) Try to resolve all with just glass laser

    If we are doing all with reg laser:
    1) choose largest FL lens that works with each mirror

    */

}


