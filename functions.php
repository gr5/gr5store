<?php
// 
// enqueue script for parent theme stylesheet
//
// note that parent theme is sinatra

function gr5_parent_styles() {
     
    // enqueue style
    wp_enqueue_style( 'parent', get_template_directory_uri().'/style.css' );
         
}
add_action( 'wp_enqueue_scripts', 'gr5_parent_styles');

//
// change backorder text
//

function gr_alt_message($n) {
  if ($n==1)
    return "Out of stock but you can backorder"; // alternative text versus default woocommerce msg
  return "OUT OF STOCK"; // this text added to name of product in cart
}

/*
function gr_product_availability_text( $availability_text, $product ) {
    // Check if product status is on backorder
    if ($product->get_stock_status() === 'onbackorder') {
        $altmessage = gr_alt_message();
        $availability_text = __( $altmessage, 'sinatra' );
    }
    return $availability_text;
}
//add_filter( 'woocommerce_get_availability_text', 'gr_product_availability_text', 10, 2 );
*/


function gr_custom_cart_item_name( $_product_title, $cart_item, $cart_item_key ) {
  $altmessage = gr_alt_message(2);
  if ( $cart_item['data']->backorders_require_notification() && $cart_item['data']->is_on_backorder( $cart_item['quantity'] ) ) {
    $_product_title .=  __( ' - '. $altmessage, 'woocommerce' ) ;
  }
  return $_product_title;
}
add_filter( 'woocommerce_cart_item_name', 'gr_custom_cart_item_name', 10, 3);

function gr_backorder_text($availability) {
    $altmessage = gr_alt_message(1);
    foreach($availability as $i) {
        $availability = str_replace('Available on backorder', $altmessage, $availability);
    }
    return $availability;
} 
add_filter('woocommerce_get_availability', 'gr_backorder_text');




//
// multi add to cart feature
//

function woocommerce_maybe_add_multiple_products_to_cart() {
// Make sure WC is installed, and add-to-cart qauery arg exists, and contains at least one comma.
if ( ! class_exists( 'WC_Form_Handler' ) || empty( $_REQUEST['add-to-cart'] ) || false === strpos( $_REQUEST['add-to-cart'], ',' ) ) {
    return;
}

// Remove WooCommerce's hook, as it's useless (doesn't handle multiple products).
remove_action( 'wp_loaded', array( 'WC_Form_Handler', 'add_to_cart_action' ), 20 );

$product_ids = explode( ',', $_REQUEST['add-to-cart'] );
$count       = count( $product_ids );
$number      = 0;

foreach ( $product_ids as $product_id ) {
    if ( ++$number === $count ) {
        // Ok, final item, let's send it back to woocommerce's add_to_cart_action method for handling.
        $_REQUEST['add-to-cart'] = $product_id;

        return WC_Form_Handler::add_to_cart_action();
    }

    $product_id        = apply_filters( 'woocommerce_add_to_cart_product_id', absint( $product_id ) );
    $was_added_to_cart = false;
    $adding_to_cart    = wc_get_product( $product_id );

    if ( ! $adding_to_cart ) {
        continue;
    }

    $add_to_cart_handler = apply_filters( 'woocommerce_add_to_cart_handler', $adding_to_cart->product_type, $adding_to_cart );

    /*
     * Sorry.. if you want non-simple products, you're on your own.
     *
     * Related: WooCommerce has set the following methods as private:
     * WC_Form_Handler::add_to_cart_handler_variable(),
     * WC_Form_Handler::add_to_cart_handler_grouped(),
     * WC_Form_Handler::add_to_cart_handler_simple()
     *
     * Why you gotta be like that WooCommerce?
     */
    if ( 'simple' !== $add_to_cart_handler ) {
        continue;
    }

    // For now, quantity applies to all products.. This could be changed easily enough, but I didn't need this feature.
    $quantity          = empty( $_REQUEST['quantity'] ) ? 1 : wc_stock_amount( $_REQUEST['quantity'] );
    $passed_validation = apply_filters( 'woocommerce_add_to_cart_validation', true, $product_id, $quantity );

    if ( $passed_validation && false !== WC()->cart->add_to_cart( $product_id, $quantity ) ) {
        wc_add_to_cart_message( array( $product_id => $quantity ), true );
    }
}
}

// Fire before the WC_Form_Handler::add_to_cart_action callback.
add_action( 'wp_loaded',        'woocommerce_maybe_add_multiple_products_to_cart', 15 );



//
// clear cart feature
//

function remove_item_from_cart() {
    global $woocommerce;
    $returned = ['status'=>'error','msg'=>'Your cart could not be emptied'];
    $woocommerce->cart->empty_cart();
    if ( $woocommerce->cart->get_cart_contents_count() == 0 ) {
        $returned = ['status'=>'success','msg'=>'Your order has been reset!'];
    }
    die(json_encode($returned));
}

add_action('wp_ajax_clear_cart', 'remove_item_from_cart');
add_action('wp_ajax_nopriv_clear_cart', 'remove_item_from_cart');


//
// Change "shipping options" message
//


function my_custom_no_shipping_message( $message ) {
	return __( 'No shipping options - contact me to add shipping for your country at thegr5store@gmail.com ' );
}

add_filter( 'woocommerce_no_shipping_available_html', 'my_custom_no_shipping_message' );
add_filter( 'woocommerce_cart_no_shipping_available_html', 'my_custom_no_shipping_message' );




//
// CODE ONLY FOR HOME PAGE IS BELOW
//

function gr_to_tf($b) {
  if ($b)
    return "true";
  else
    return "false";
}

function product_info_to_jscript($desc,$id) {
  $_product = wc_get_product($id);
  echo "gr_prices['$desc'] = ".$_product->get_price().";\n";
  echo "gr_instock['$desc'] = ".gr_to_tf(
      $_product->is_in_stock() && 
      ($_product->get_manage_stock() == false ||
      $_product->get_stock_quantity() > 0)
      ).";\n";
  echo "gr_pretty_price['$desc'] = '".$_product->get_price_html()."';\n";
  echo "gr_images['$desc'] = '".$_product->get_image("woocommerce_gallery_thumbnail")."';\n";
  echo "gr_prod_id['$desc'] = $id;\n";
}

function gr5_hook_javascript_footer() {
  if (get_queried_object_id() != 21) // 21 is page id for home page
     return;

  // okay this is the "home" page
  echo "<script src='".dirname($_SERVER['PHP_SELF'])."/wp-content/themes/gr5/grstuff.js'></script>\n";
  echo "<script>\n";
  echo "var gr_theme_path='".dirname($_SERVER['PHP_SELF'])."/wp-content/themes/gr5/';\n";
  echo "var gr_prices=[];\n";
  echo "var gr_instock=[];\n";
  echo "var gr_pretty_price=[];\n";
  echo "var gr_images=[];\n";
  echo "var gr_prod_id=[];\n";
  product_info_to_jscript('laser17',44);
  product_info_to_jscript('laser26',11);
  product_info_to_jscript('lens765',39);
  product_info_to_jscript('lens9',35);
  product_info_to_jscript('lens10',126);
  product_info_to_jscript('lens13',38);
  product_info_to_jscript('lens20',149);
  product_info_to_jscript('cube',33);
  product_info_to_jscript('if',28);
  product_info_to_jscript('flat',40);
  product_info_to_jscript('xyz_asm',59);
  product_info_to_jscript('xyz_kit',47);
  product_info_to_jscript('xyz_plastic',65);
  product_info_to_jscript('xyz_metal',62);
  echo "var cart_items = ".WC()->cart->get_cart_contents_count().";\n";

  echo "gr_go();\n";
  echo "</script>\n";
}
add_action('wp_footer', 'gr5_hook_javascript_footer');

?>
