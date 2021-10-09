
function doit()
{
  location.href="/wp/cart/?add-to-cart=44,59";
}

var fratios = [];
var fratios_subset=[];

class laser_lens
{
  constructor(_laser_type, _lens_fl, _minfr, _maxfr, _notes="")
  {
    this.laser_type = _laser_type;
    this.lens_fl    = _lens_fl;
    this.minfr      = _minfr;
    this.maxfr      = _maxfr;
    this.notes      = _notes;
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
    return this.laser_type;
  }
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
  var str="<table><tr><th colspan=2>Laser Type</th><th>Lens</th><th>Mirror F/#</th><th>Max Mirror Diameter</th></tr>\n";

  // first count qty of lenses
  var qty_lenses=0;
  for (j=0; j < laser_lens_combos.length; j++)
  {
    ll = laser_lens_combos[j];
    if (ll.qtyMirrorsNeed > 0)
      qty_lenses++;
  }

  var bFirst=true;
  for (j=0; j < laser_lens_combos.length; j++)
  {
    ll = laser_lens_combos[j];
    if (ll.qtyMirrorsNeed > 0)
    {
      if (bFirst==true)
      {
        str+="<tr><td rowspan="+qty_lenses+"><img src='"+ll.laserImagePath()+"' width=50></td><td>\n";
      }
      else
      {
        str+="<tr><td>\n";
      }
      str+=ll.laserPretty()+"</td><td>"+ll.lens_fl+"mm "+ll.notes+"</td><td>"+ll.mirrors+"</td>";
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
    document.getElementById('gr_cont1').disabled="disabled";
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
  t.innerHTML="So far: "+s+" <font size=-1><a href='javascript:gr_clear_f();'>clear</a></font><br>";
  save_cookie("grf",c);
  document.getElementById('gr_cont1').disabled="";
  choose_optics();
}

function gr_clear_f()
{
  fratios=[];
  gr_update_fs();
}

function gr_go()
{
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
  x="<font color=red>This page is experimental.</font>  <a href='https://thegr5store.com/wp/?product_cat=bath'>Click here to shop.</a><p>";

  x+="Use this page to help you pick out an inexpensive Bath Interferometer. ";
  x+="<br>";
  x+="Step 1 - choose laser and diverger<br>\n";
  x+="Please enter F/#'s of a mirror you want to test. Then press enter or click add button until you have listed them all.<br>\n";
  x+="example   4    for f/4 <br>\n";
  x+="F/#&nbsp;";
  x+="<input type='text' id='gr_fnum' value=6 size=2";
  x+=" onkeydown = 'if (event.keyCode==13)gr_addF()' >";
  x+="<input type='button' value='add' onclick='gr_addF()'><br>\n";
  x+="<span id='gr_spn_sofar'></span><br>\n";
  x+="<div id='idOptics1'></div>\n";
  x+="<div id='idOptics2'></div>\n";
  x+="<div id='idOptics3'></div>\n";
  x+="<div id='idOptics4'></div>\n";
  
  x+="<input type='button' value='Continue with this option (still under construction)' id='gr_cont1'><br>\n";
  
/*

  x+="<p><input type='button' value='add multiple items to cart' onclick='doit()'>";
  x+="<p>pretty if price: "+gr_pretty_price['if']+"<p>";
  x+= "cart items: "+cart_items+"<p>";
  x+= gr_img_cube;
  
  */
  
  t.innerHTML += x;
  gr_load_cookies();
  gr_update_fs();
  //document.cookie="a=hay";
  //document.cookie="b=bee";
 
  choose_optics();
  
}

var laser_lens_combos = [];
// must be sorted by minimum F/# column
laser_lens_combos.push( new laser_lens("glass", 7.65, 1.8, 4.4) );
laser_lens_combos.push( new laser_lens("glass", 9,    2.6, 5.2) );
laser_lens_combos.push( new laser_lens("reg",   7.65, 3.3, 6.6) );
laser_lens_combos.push( new laser_lens("reg",   9,    3.6, 7.2) );
laser_lens_combos.push( new laser_lens("glass", 13,   3.7, 7.4) );
laser_lens_combos.push( new laser_lens("reg",   13,   4.7, 10) );

// edmunds lenses
laser_lens_combos.push( new laser_lens("glass", 18,   6.1, 10, "(Edmund Optics 32-966)") ); // f/5 minimum.  6.1 chosen to give priority to 13mm lens
laser_lens_combos.push( new laser_lens("reg",   18,   8, 15,   "(Edmund Optics 32-966)") );
laser_lens_combos.push( new laser_lens("glass", 30,   8.5, 15, "(Edmund Optics 45-133)") );
laser_lens_combos.push( new laser_lens("glass", 40,   10, 20,  "(Edmund Optics 63-540)") );
laser_lens_combos.push( new laser_lens("reg",   30,   13, 25,  "(Edmund Optics 45-133)") );
laser_lens_combos.push( new laser_lens("reg",   40,   17, 34,  "(Edmund Optics 63-540)") );





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
        result+="F/"+fratio+" mirror (less than F/"+laser_lens_combos[0].minfr+
                ") is pretty extreme - please contact us about testing this mirror<br>";
        fratios_subset.splice(i,1); // remove this one from the array
        i--;
      }
      else if (fratio > laser_lens_combos[laser_lens_combos.length-1].maxfr)
      {
        result+="F/"+fratio+" mirror (greater than F/"+laser_lens_combos[laser_lens_combos.length-1].maxfr+
                ") will need a longer focal length lens than I normally sell but these are available - please contact us about testing this mirror<br>";
        fratios_subset.splice(i,1); // remove this one from the array
        i--;
      }
    }



    if (willLaserHandle("reg"))
    {
      selectLenses("reg");
      display_chosen("idOptics2");
      if (willLaserHandle("glass"))
      {
        ll_resetAll();
        selectLenses("glass");
        document.getElementById("idOptics3").innerHTML = 
          "<p>Or alternatively get the glass laser and these lenses:";
        display_chosen("idOptics4");
      }
    }
    else
    {
      selectLenses("glass");
      display_chosen("idOptics2");
    }

    /*
    else if (willLaserHandle("glass"))
    {
      selectLenses("glass");
      display_chosen();
    } else
    {
      selectLenses("");
      display_chosen();
    }
    */



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


