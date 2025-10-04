<?php
/**
 * Custom Header for Astra Child Theme
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="bg-white sticky top-0 z-50 transition-shadow duration-300 shadow-none">
  <div class="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">

  <div class="bg-red-500 h-20 w-20">TEST</div>

    <!-- Hamburger (Mobile Only) -->
    <button class="md:hidden text-gray-700 hover:text-[#008F32] js-mobile-toggle" aria-label="Open menu">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- Logo -->
    <div class="flex items-center mx-auto md:mx-0">
      <a href="<?php echo esc_url( home_url('/') ); ?>">
        <img src="<?php echo esc_url( get_stylesheet_directory_uri() . '/images/healthlane-logo-colored.png' ); ?>" alt="HealthLane Logo" class="h-8 w-auto !important">
      </a>
    </div>

    <!-- Desktop Nav -->
    <nav class="hidden md:flex space-x-8 items-center ml-auto">
      <?php
        wp_nav_menu( array(
          'theme_location' => 'primary',
          'menu_class'     => 'flex space-x-8',
          'container'      => false,
          'fallback_cb'    => false,
          // Simple <a> links; dropdown/mega can be added later
          'link_before'    => '<span class="text-sm font-medium text-gray-700 hover:text-[#008F32] transition-colors duration-300">',
          'link_after'     => '</span>',
        ) );
      ?>
    </nav>
  </div>

  <!-- Mobile Drawer -->
  <div class="fixed top-0 left-0 h-full w-80 bg-white shadow-lg z-50 transform -translate-x-full transition-transform duration-300 js-mobile-drawer" aria-hidden="true">
    <div class="flex items-center justify-between px-6 h-16 border-b border-gray-200">
      <a href="<?php echo esc_url( home_url('/') ); ?>">
        <img src="<?php echo esc_url( get_stylesheet_directory_uri() . '/images/healthlane-logo-colored.png' ); ?>" alt="HealthLane Logo" class="h-10 w-auto">
      </a>
      <button class="text-gray-700 hover:text-[#008F32] js-mobile-close" aria-label="Close menu">✕</button>
    </div>

    <nav class="px-6 py-4 space-y-1">
      <?php
        wp_nav_menu( array(
          'theme_location' => 'mobile',
          'menu_class'     => 'space-y-2',
          'container'      => false,
          'fallback_cb'    => false,
          'link_before'    => '<span class="block text-sm font-medium text-gray-700 hover:text-[#008F32] py-3 border-b border-gray-100">',
          'link_after'     => '</span>',
        ) );
      ?>
    </nav>

    <!-- Social Icons -->
    <div class="mt-6 flex justify-center space-x-6 px-6 pb-6">
      <a href="https://www.facebook.com/bitspacechicago" target="_blank" rel="noopener" class="text-gray-400 hover:text-[#008F32]" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
      <a href="https://www.instagram.com/bitspacechicago" target="_blank" rel="noopener" class="text-gray-400 hover:text-[#008F32]" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
      <a href="https://www.tiktok.com/@bitspacechicago" target="_blank" rel="noopener" class="text-gray-400 hover:text-[#008F32]" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
    </div>
  </div>
</header>