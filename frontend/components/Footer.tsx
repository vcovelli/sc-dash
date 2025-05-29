export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          © {new Date().getFullYear()} SupplyWise Inc. — All rights reserved.
        </span>
        <div className="mt-4 md:mt-0 space-x-4">
          <a
            href="/privacy"
            className="hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            Terms
          </a>
          <a
            href="/contact"
            className="hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
