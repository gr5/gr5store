function doit()
{
  //location.href="/wp/cart/?add-to-cart=44,59";
}


var fratios = [];
var fratios_subset=[];

class laser_lens
{
  constructor(_laser_type, _lens_fl, _minfr, _maxfr, _price, _notes="", _product_id)
  {
    this.laser_type = _laser_type;
    this.lens_fl    = _lens_fl;
    this.minfr      = _minfr;
    this.maxfr      = _maxfr;
    this.notes      = _notes;
    this.price      = _price;
    this.product_id = _product_id;
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
    this.xyz="kit"; // other options: asm metal plastic none
    this.bAssembled=false;
    this.bSkipDivergers=false;
    this.bSkipCube=false;
    this.bSkipFlat=false;
    this.bSkipIFPlastic=false;
    this.bSkipLaser=false;
    this.bGlassLaser=false;
    this.laser="1.7"; // 1.7 means regular laser.  2.6 means glass laser
  }
  
  get_xyz_cost()
  {
    switch (this.xyz)
    {
      case 'metal':
        return gr_prices['xyz_metal'];
      case 'plastic':
        return gr_prices['xyz_plastic'];
      case 'kit':
        return gr_prices['xyz_kit'];
      case 'asm':
        return gr_prices['xyz_asm'];
      case 'none':
        return 0;
    }
  }

  get_cost()
  {
    var sum=this.get_xyz_cost();

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
  
    get_prod_ids()
    {
        var ret = new Array();

        // laser
        if (this.bSkipLaser==false)
        {
           switch(this.laser)
           {
             case "2.6":
               ret.push(gr_prod_id['laser26']);
               break;
             case "1.7":
             default:
               ret.push(gr_prod_id['laser17']);
           }
        }

        // now lenses
        var edmunds_sum=0;
        for (j=0; j < laser_lens_combos.length; j++)
        {
          ll = laser_lens_combos[j];
          if (ll.qtyMirrorsNeed > 0)
          {
            if (ll.notes.indexOf("Edmund") == -1)
              ret.push(ll.product_id);
          }
        }

        if (this.bSkipCube==false) ret.push(gr_prod_id['cube']);
        if (this.bSkipFlat==false) ret.push(gr_prod_id['flat']);
        if (this.bSkipIFPlastic==false) ret.push(gr_prod_id['if']);


        // stage options
        switch (this.xyz)
        {
          case 'metal':
            ret.push(gr_prod_id['xyz_metal']);
            break;
          case 'plastic':
            ret.push(gr_prod_id['xyz_plastic']);
            break;
          case 'kit':
            ret.push(gr_prod_id['xyz_kit']);
            break;
          case 'asm':
            ret.push(gr_prod_id['xyz_asm']);
            break;
          case 'none':
        }

        return ret;

    }
}

function gr_empty()
{
    document.getElementById('idClearCart').innerHTML='Please wait...';
    jQuery.ajax({
    type: 'POST',
    dataType: 'json',
    url: '/wp/wp-admin/admin-ajax.php?action=clear_cart',
    data: {action : 'clear_cart'},
    success: function (data) {
            if (data.status != 'success') {
                alert(data.msg);
            } else {
                document.getElementById('idClearCart').innerHTML='';
                alert("Cart successfully cleared");
                cart_items=0;

            }
        }
    });
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
      {
        gr_update_fs();
        return; // already have this one.  Don't add it again.
      }
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
  laser_lens_combos.push( new laser_lens("glass", 7.65, 1.8, 4.4, gr_prices['lens765'],"", gr_prod_id['lens765'] ));
//laser_lens_combos.push( new laser_lens("glass", 9,    2.6, 5.2, gr_prices['lens9'],  "", gr_prod_id['lens9'] ));
  laser_lens_combos.push( new laser_lens("glass",10,    2.8, 5.6, gr_prices['lens10'],  "", gr_prod_id['lens10'] ));
  laser_lens_combos.push( new laser_lens("reg",   7.65, 3.3, 6.6, gr_prices['lens765'],"", gr_prod_id['lens765'] ));
//laser_lens_combos.push( new laser_lens("reg",   9,    3.6, 7.2, gr_prices['lens9'],  "", gr_prod_id['lens9'] ));
  laser_lens_combos.push( new laser_lens("glass", 13,   3.7, 7.4, gr_prices['lens13'], "", gr_prod_id['lens13'] ));
  laser_lens_combos.push( new laser_lens("reg",  10,    4.0, 8.0, gr_prices['lens10'], "", gr_prod_id['lens10'] ));
  laser_lens_combos.push( new laser_lens("reg",   13,   4.7, 10,  gr_prices['lens13'], "", gr_prod_id['lens13'] ));

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

  //x+= "<div class='gr_img'>"+gr_img_cube+"</div>";

  x="Use this page to help you pick out an inexpensive Bath Interferometer or if you already know what you want you ";
  x+="<a href='https://thegr5store.com/wp/?product_cat=bath'>can click here to see all products.</a><p>";

  x+="<br>";
  x+="Step 1 - choose laser and diverger<br>\n";
  x+="Please enter F/#'s of a mirror you want to test. Then press enter or click add button until you have listed them all.<br>\n";
  x+="example   4    for f/4 <br>\n";
  x+="F/#&nbsp;";
  x+="<input type='text' id='gr_fnum' value=6 size=2";
  x+=" onkeydown = 'if (event.keyCode==13)gr_addF()' style='width:auto' >";
  x+="&nbsp;<input type='button' value='add' onclick='gr_addF()'><br>\n";
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
  
  //jQuery('.gr_img img').width(50).height(50);

}

var laser_lens_combos = [];


var inst_cost_summer = new cost_summer(laser_lens_combos); // inst=instance

function gr_price_diff(kit)
{
    var increase = -inst_cost_summer.get_xyz_cost(); // current price
    if (kit != "none")
      increase += gr_prices["xyz_"+kit]; // proposed price
    if (increase == 0) return "";
    if (increase > 0)
      return "($"+increase.toFixed(2)+" more)";
    else
      return "(Save $"+(-increase).toFixed(2)+")";
}


var result="";

function gr_cont(chosen_laser)
{
    document.getElementById("idOptics1").innerHTML="";
    document.getElementById("idOptics2").innerHTML="";
    document.getElementById("idOptics3").innerHTML="";
    document.getElementById("idOptics4").innerHTML="";
    ll_resetAll();
    selectLenses(chosen_laser);
    inst_cost_summer.reset();
    inst_cost_summer.xyz="asm"; // set default - asm is assembled version, kit is kit version
    if (gr_instock['xyz_asm'] == false)
        inst_cost_summer.xyz="kit";
    update_cost_step2(chosen_laser);
    gr_cont_display();
}

function gr_cont_display()
{
    var x="";
    x+="<table style='font-size:0.7rem'>";
    x+="<tr><th colspan=3>";
    x+="<center>Recommended parts to buy:</center>";
    x+="</th></tr>";
    x+="<tr>";

    //
    // laser
    //

    var j;
    var bFound=false;
    for (j=0; j < laser_lens_combos.length; j++)
    {
      ll = laser_lens_combos[j];
      if (ll.qtyMirrorsNeed > 0)
      {
        break;
      }
    }


    x+="<td class='gr_img'>";
    x+="<img src='"+ll.laserImagePath()+"' width=50 style='vertical-align:middle'>";
    x+="</td><td>";
    x+=ll.laserPretty()+" laser";
    x+="</td><td>$";
    if (ll.laser == "reg")
      x+=gr_prices['laser17'];
    else
      x+=gr_prices['laser26'];

    x+="</td>";
    x+="</tr>";

    //
    // diverging lenses
    //

    var qtyEdmunds=0;
    for (j=0; j < laser_lens_combos.length; j++)
    {
      ll = laser_lens_combos[j];
      if (ll.qtyMirrorsNeed > 0)
      {
        bNothingFound=false;
        if (ll.notes.indexOf("Edmund") !== -1)
        {
          qtyEdmunds++;
          continue;
        }
        x+="<tr>";
        x+="<td class='gr_img'>";
        x+=gr_images['lens9'];
        x+="</td><td>";
        x+=ll.lens_fl+"mm diverger";
        x+="</td><td>$";
        x+=ll.price;
        x+="</td>";
        x+="</tr>";

      }
    }

    // cube

    x+="<tr>";
    x+="<td class='gr_img'>";
    x+=gr_images['cube'];
    x+="</td><td>";
    x+="15mm splitter cube";
    x+="</td><td>$";
    if (inst_cost_summer.bSkipCube)
      x+="<strike>";
    x+=gr_prices['cube'];
    if (inst_cost_summer.bSkipCube)
      x+="</strike>";
    x+="</td><td>";
    if (inst_cost_summer.bSkipCube)
      x+="<input type='checkbox' "+
         "onClick=\"inst_cost_summer.bSkipCube=false;gr_cont_display();\" >";
    else
      x+="<input type='checkbox' checked "+
         "onClick=\"inst_cost_summer.bSkipCube=true;gr_cont_display();\" >";
    x+=  "Include Cube";
    x+=  "<br><span style='font-size:0.5rem'>Only uncheck this if you already have a 15mm splitter cube</span>";
    x+="</td></tr>";

    // flat

    x+="<tr>";
    x+="<td class='gr_img'>";
    x+=gr_images['flat'];
    x+="</td><td>";
    x+="Flat mirror (mounted)";
    x+="</td><td>$";
    if (inst_cost_summer.bSkipFlat)
      x+="<strike>";
    x+=gr_prices['flat'];
    if (inst_cost_summer.bSkipFlat)
      x+="</strike>";
    x+="</td><td>";
    if (inst_cost_summer.bSkipFlat)
      x+="<input type='checkbox' "+
         "onClick=\"inst_cost_summer.bSkipFlat=false;gr_cont_display();\" >";
    else
      x+="<input type='checkbox' checked "+
         "onClick=\"inst_cost_summer.bSkipFlat=true;gr_cont_display();\" >";
    x+="Include Flat";
    x+="<br><span style='font-size:0.5rem'>Only uncheck this if you already have a lambda/4 flat 12mm-20mm on a side</span>";
    x+="</td></tr>";

    // interferometer

    x+="<tr>";
    x+="<td class='gr_img'>";
    x+=gr_images['if'];
    x+="</td><td>";
    x+="Interferometer plastic parts";
    x+="</td><td>$";
    if (inst_cost_summer.bSkipIFPlastic)
      x+="<strike>";
    x+=gr_prices['if'];
    if (inst_cost_summer.bSkipIFPlastic)
      x+="</strike>";
    x+="</td><td>";
    if (inst_cost_summer.bSkipIFPlastic)
      x+="<input type='checkbox' "+
         "onClick=\"inst_cost_summer.bSkipIFPlastic=false;gr_cont_display();\" >";
    else
      x+="<input type='checkbox' checked "+
         "onClick=\"inst_cost_summer.bSkipIFPlastic=true;gr_cont_display();\" >";
    x+="Include Interferometer Plastic Parts";
    x+="<br><span style='font-size:0.5rem'>Only uncheck this if you will be 3d printing the plastic portion yourself (contact me for files)</span>";
    x+="</td></tr>";

    // XYZ Stage


    // assembled stage
    // complete kit (save $)- takes 1 or 2 hours to assemble *details*
    // partial kit (save $)- metal parts only.  for people who have a 3d printer
    // no stage (- for people who already have an xyz stage

    x+="<tr>";
    x+="<td class='gr_img'>";
    x+=gr_images['xyz_asm'];
    x+="</td><td>";
    x+="XYZ Stage";
    x+="</td><td>$";
    x+= inst_cost_summer.get_xyz_cost();
    x+="</td><td>";
    x+="<input type='radio' name='gr_radio' id='gr_rad_asm' value=1><label for='gr_rad_asm'> "+
       "assembled "+gr_price_diff("asm");
    if (gr_instock['xyz_asm'] == false)
       x+=" <b>(out of stock)</b>";
    x+="</label><br>";
    x+="<input type='radio' name='gr_radio' id='gr_rad_kit' value=2><label for='gr_rad_kit'> "+
       "complete kit "+gr_price_diff("kit")+" - 1 or 2 hours to assemble</label><br>";
    x+="<input type='radio' name='gr_radio' id='gr_rad_metal' value=3><label for='gr_rad_metal'> "+
       "partial kit "+gr_price_diff("metal")+" - metal parts only. If you have a 3d printer.</label><br>";
    x+="<input type='radio' name='gr_radio' id='gr_rad_none' value=4><label for='gr_rad_none'> "+
       "no stage "+gr_price_diff("none")+" For people who already have an xyz stage</label><br>";


    x+="</td></tr>";




    // total
    x+="<tr><td></td><td>Total:</td><td>"+inst_cost_summer.get_cost()+"</td></tr>";
    x+="</table>"
    
    //
    // buttons at the bottom
    //
    
    if (cart_items > 0)
    {
        x+="<span id='idClearCart'><input type='button' value='Empty Shopping Cart' onclick='gr_empty()'> ";
        x+="You have "+cart_items+" items in the cart already.  Do you want to ";
        x+="remove them first before we add more?</span><br>\n";
    }
    
    x+="<input type='button' value='Add to Cart' onclick='gr_addtocart()' id='idAddToCart'>\n";
    
    document.getElementById("idOptics1").innerHTML=x;

    /*x = jQuery(window).width();
    x+= " "+jQuery("#primary").width();
    document.getElementById("idOptics2").innerHTML= x;*/


    jQuery('.gr_img img').width(50).height(50);
    switch (inst_cost_summer.xyz)
    {
      case 'asm':
        jQuery("#gr_rad_asm").prop("checked", true);
        break;
      case 'kit':
        jQuery("#gr_rad_kit").prop("checked", true);
        break;
      case 'metal':
        jQuery("#gr_rad_metal").prop("checked", true);
        break;
      case 'none':
        jQuery("#gr_rad_none").prop("checked", true);
        break;
      default:
    }


    jQuery('input[type=radio][name="gr_radio"]').change(function() {
        var rb_value = jQuery('input[name="gr_radio"]:checked').val();
        switch(rb_value)
        {
          case "1":
            inst_cost_summer.xyz="asm";
            break;
          case "2":
            inst_cost_summer.xyz="kit";
            break;
          case "3":
            inst_cost_summer.xyz="metal";
            break;
          case "4":
            inst_cost_summer.xyz="none";
            break;
          default:
        }
        gr_cont_display();
    });


}

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

function update_cost_step2(laser_type)
{
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
      document.getElementById('idOptics2btn').onclick=function(){gr_cont('reg');};
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
        document.getElementById('idOptics4btn').onclick=function(){gr_cont('glass');};
        document.getElementById('idOptics4spn').innerHTML=
            "<br>This laser is nicer and has a glass focusing lens which is easier to take out and clean";
        
      }
    }
    else
    {
      selectLenses("glass");
      display_chosen("idOptics2");
      document.getElementById('idOptics2btn').value="Continue with these parts";
      document.getElementById('idOptics2btn').onclick=function(){gr_cont('glass');};
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

function gr_addtocart()
{
  document.getElementById('idAddToCart').setAttribute("disabled", "disabled");
  var url = "/wp/cart/?add-to-cart=";
  url += inst_cost_summer.get_prod_ids().join(",");
  location.href=url;
}

