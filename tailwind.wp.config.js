// tailwind.wp.config.js
module.exports = {
  important: true,
  content: [
    "./wp-snippets/**/*.{html,php}" // dummy markup we’ll give it
  ],
  safelist: [
    // Header wrapper
    'bg-white', 'sticky', 'top-0', 'z-50', 'transition-shadow', 'duration-300', 'shadow-sm', 'shadow-none',

    // Container
    'mx-auto', 'max-w-7xl', 'px-6', 'flex', 'items-center', 'justify-between', 'h-16',

    // Hamburger
    'md:hidden', 'text-gray-700', 'hover:text-[#008F32]', 'h-6', 'w-6',

    // Logo
    'mx-auto', 'md:mx-0', 'h-10', 'w-auto', 'h-8',

    // Desktop nav
    'hidden', 'md:flex', 'space-x-8', 'items-center', 'ml-auto',
    'text-sm', 'font-medium', 'text-gray-700', 'transition-colors', 'duration-300',

    // Dropdown wrappers
    'relative', 'absolute', 'left-0', 'top-full', 'mt-2',
    'w-[500px]', 'w-[360px]', 'grid', 'grid-cols-2', 'rounded-lg',
    'bg-white', 'shadow-lg', 'ring-1', 'ring-black/5', 'z-50', 'animate-fadeIn',
    'p-6', 'bg-gray-50', 'mb-3',

    // Dropdown text
    'text-xs', 'font-bold', 'uppercase', 'tracking-wide', 'text-gray-500',
    'space-y-1.5', 'block', 'py-2', 'px-2', 'text-gray-800',
    'hover:bg-gray-100', 'rounded-md',

    // Educator list
    'flex', 'items-start', 'space-x-3', 'p-2', 'rounded-md',
    'h-5', 'w-5', 'flex-shrink-0', 'text-gray-400',
    'text-xs', 'text-gray-500',

    // Overlay
    'fixed', 'inset-0', 'bg-black/80', 'z-40',

    // Mobile drawer
    'h-full', 'w-84', 'translate-x-0', '-translate-x-full',
    'transition-transform',

    // Mobile nav
    'justify-between', 'border-b', 'border-gray-200',
    'space-y-1', 'border-gray-100',
    'w-full', 'ml-2', 'rotate-180',
    'block', 'text-gray-600', 'py-2.5',

    // Social icons
    'mt-6', 'justify-center', 'space-x-6', 'pb-6',
    'h-5', 'w-5', 'text-gray-400', 'transition-colors',

    'flex', 'items-center', 'gap-8', 'list-none', 'm-0', 'p-0',
    'hidden', 'md:flex', 'ml-auto',

  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
