/**
 * Dummy API Client for Vercel demo — no backend, all in-memory dummy data.
 * Same interface as the real client so the UI works unchanged.
 */

// ——— In-memory stores (orchestrated like a read backend) ———
const plansStore = new Map();
const manualPlansStore = new Map();

const DUMMY_SCENARIOS = [
  {
    id: 'sc-1',
    title: 'User Authentication & Session Management',
    feature_area: 'Authentication',
    test_cases: [
      {
        title: 'Successful login with valid email and password',
        type: 'Positive', priority: 'P1', source: 'ai', is_automated: false,
        description: 'Verify that a registered user can log in with valid credentials and is redirected to the dashboard with an active session.',
        preconditions: 'User account exists with verified email. Browser cookies are enabled.',
        steps: [
          { step_number: 1, action: 'Navigate to the application login page at /login', expected_outcome: 'Login page loads with email and password fields, "Remember me" checkbox, and "Sign In" button visible' },
          { step_number: 2, action: 'Enter a valid registered email address in the email field', expected_outcome: 'Email is accepted without validation errors; field shows the entered text' },
          { step_number: 3, action: 'Enter the correct password in the password field', expected_outcome: 'Password is masked with dots/asterisks; eye icon toggle is available' },
          { step_number: 4, action: 'Click the "Sign In" button', expected_outcome: 'Loading spinner appears on the button; form fields become disabled during submission' },
          { step_number: 5, action: 'Wait for authentication to complete', expected_outcome: 'User is redirected to /dashboard; welcome message displays the user\'s name; session token is stored in cookies' },
          { step_number: 6, action: 'Verify the navigation bar shows the authenticated state', expected_outcome: 'Profile avatar appears in the top-right corner; "Sign In" link is replaced with user dropdown menu' },
        ],
      },
      {
        title: 'Login attempt with invalid password shows error',
        type: 'Negative', priority: 'P1', source: 'ai', is_automated: false,
        description: 'Verify that entering an incorrect password displays an appropriate error message without revealing whether the email exists.',
        preconditions: 'User account exists with a known email address.',
        steps: [
          { step_number: 1, action: 'Navigate to the login page', expected_outcome: 'Login form is displayed with empty fields' },
          { step_number: 2, action: 'Enter a valid registered email address', expected_outcome: 'Email field accepts the input' },
          { step_number: 3, action: 'Enter an incorrect password (e.g., "wrongpassword123")', expected_outcome: 'Password field accepts the input and masks it' },
          { step_number: 4, action: 'Click the "Sign In" button', expected_outcome: 'Loading indicator appears briefly' },
          { step_number: 5, action: 'Observe the error message displayed', expected_outcome: 'Error banner appears: "Invalid email or password. Please try again." Password field is cleared; email field retains its value. No information about whether the email exists is revealed.' },
        ],
      },
      {
        title: 'Session timeout after inactivity period',
        type: 'Edge', priority: 'P2', source: 'ai', is_automated: false,
        description: 'Verify that the user session expires after the configured inactivity timeout and the user is redirected to login.',
        preconditions: 'User is logged in. Session timeout is configured to 30 minutes.',
        steps: [
          { step_number: 1, action: 'Log in successfully and navigate to the dashboard', expected_outcome: 'Dashboard loads with active session' },
          { step_number: 2, action: 'Leave the application idle without any interaction for 30+ minutes', expected_outcome: 'No visible change during the idle period' },
          { step_number: 3, action: 'After the timeout period, click any navigation link or perform any action', expected_outcome: 'Application redirects to the login page with a message: "Your session has expired. Please sign in again."' },
          { step_number: 4, action: 'Attempt to use the browser back button to return to the dashboard', expected_outcome: 'User remains on the login page; cached dashboard content is not displayed' },
          { step_number: 5, action: 'Log in again with valid credentials', expected_outcome: 'New session is created; user is redirected to the dashboard with fresh data' },
        ],
      },
      {
        title: 'Password visibility toggle functionality',
        type: 'UI Validation', priority: 'P3', source: 'ai', is_automated: false,
        description: 'Verify the eye icon toggle on the password field correctly shows and hides the password text.',
        preconditions: 'Login page is accessible.',
        steps: [
          { step_number: 1, action: 'Navigate to the login page', expected_outcome: 'Password field is displayed with type="password" and an eye icon button' },
          { step_number: 2, action: 'Type "TestPassword123!" in the password field', expected_outcome: 'Characters are masked as dots/bullets' },
          { step_number: 3, action: 'Click the eye icon (show password toggle)', expected_outcome: 'Password text "TestPassword123!" becomes visible in plain text; eye icon changes to "eye-off" variant' },
          { step_number: 4, action: 'Click the eye icon again to hide the password', expected_outcome: 'Password is masked again; eye icon returns to the original "eye" variant' },
          { step_number: 5, action: 'Verify the toggle works with an empty password field', expected_outcome: 'Toggle icon is still clickable; no errors occur when toggling with empty field' },
        ],
      },
      {
        title: 'Account lockout after multiple failed login attempts',
        type: 'Negative', priority: 'P1', source: 'ai', is_automated: false,
        description: 'Verify that the account is temporarily locked after 5 consecutive failed login attempts to prevent brute-force attacks.',
        preconditions: 'User account exists. Account lockout threshold is set to 5 attempts with a 15-minute lockout period.',
        steps: [
          { step_number: 1, action: 'Navigate to the login page and enter a valid email', expected_outcome: 'Email field accepts the input' },
          { step_number: 2, action: 'Enter an incorrect password and click "Sign In" — repeat this 4 times', expected_outcome: 'Each attempt shows "Invalid email or password" error. After the 3rd attempt, a warning appears: "2 attempts remaining before account lockout."' },
          { step_number: 3, action: 'Enter an incorrect password a 5th time and click "Sign In"', expected_outcome: 'Account is locked. Message displays: "Account temporarily locked due to multiple failed attempts. Please try again in 15 minutes or reset your password."' },
          { step_number: 4, action: 'Attempt to log in with the correct password immediately', expected_outcome: 'Login is rejected with the same lockout message even though the password is correct' },
          { step_number: 5, action: 'Wait 15 minutes and attempt login with the correct password', expected_outcome: 'Login succeeds; user is redirected to the dashboard; failed attempt counter is reset' },
        ],
      },
    ],
  },
  {
    id: 'sc-2',
    title: 'Product Search & Filtering',
    feature_area: 'Search',
    test_cases: [
      {
        title: 'Search returns relevant results for keyword query',
        type: 'Positive', priority: 'P1', source: 'ai', is_automated: false,
        description: 'Verify that the search functionality returns accurate and relevant product results based on keyword input.',
        preconditions: 'Product catalog contains at least 50 products across multiple categories. Search index is up to date.',
        steps: [
          { step_number: 1, action: 'Navigate to the home page and locate the search bar in the header', expected_outcome: 'Search bar is visible with placeholder text "Search products..."' },
          { step_number: 2, action: 'Click on the search bar to focus it', expected_outcome: 'Search bar expands; cursor is active; recent searches dropdown may appear' },
          { step_number: 3, action: 'Type "wireless headphones" in the search field', expected_outcome: 'Auto-suggest dropdown appears after 2-3 characters showing matching product names and categories' },
          { step_number: 4, action: 'Press Enter or click the search icon to execute the search', expected_outcome: 'Search results page loads showing products matching "wireless headphones"; result count is displayed (e.g., "24 results found")' },
          { step_number: 5, action: 'Verify the search results are relevant', expected_outcome: 'Top results contain "wireless headphones" in their title or description; results are sorted by relevance by default; each result shows product image, name, price, and rating' },
          { step_number: 6, action: 'Verify the search term is preserved in the search bar', expected_outcome: 'Search bar still shows "wireless headphones"; breadcrumb shows "Search results for: wireless headphones"' },
        ],
      },
      {
        title: 'Empty search query shows validation message',
        type: 'Negative', priority: 'P2', source: 'ai', is_automated: false,
        description: 'Verify that submitting an empty search query shows an appropriate validation message instead of returning all products.',
        preconditions: 'Application is loaded and search bar is accessible.',
        steps: [
          { step_number: 1, action: 'Click on the search bar without typing anything', expected_outcome: 'Search bar is focused; no auto-suggest appears' },
          { step_number: 2, action: 'Press Enter to submit the empty search', expected_outcome: 'Validation message appears: "Please enter a search term"; no navigation occurs' },
          { step_number: 3, action: 'Type only spaces "   " and press Enter', expected_outcome: 'Same validation message appears; whitespace-only input is treated as empty' },
          { step_number: 4, action: 'Type a single character "a" and press Enter', expected_outcome: 'Search executes and returns results matching "a"; no validation error' },
          { step_number: 5, action: 'Clear the search field using the X button and verify', expected_outcome: 'Search field is cleared; user remains on the current page; no search is triggered' },
        ],
      },
      {
        title: 'Filter products by price range',
        type: 'Positive', priority: 'P2', source: 'ai', is_automated: false,
        description: 'Verify that the price range filter correctly narrows down search results to products within the specified range.',
        preconditions: 'Search results page is loaded with at least 20 results spanning various price points.',
        steps: [
          { step_number: 1, action: 'Perform a search for "laptop" to get a broad result set', expected_outcome: 'Search results load with multiple products at various price points' },
          { step_number: 2, action: 'Locate the price filter in the left sidebar and set minimum price to $500', expected_outcome: 'Min price input accepts the value; results begin to update' },
          { step_number: 3, action: 'Set maximum price to $1000', expected_outcome: 'Results are filtered to show only products priced between $500 and $1000; result count updates' },
          { step_number: 4, action: 'Verify all displayed products fall within the $500-$1000 range', expected_outcome: 'Every visible product has a price >= $500 and <= $1000; no products outside this range are shown' },
          { step_number: 5, action: 'Click "Clear Filters" to remove the price range', expected_outcome: 'All original search results are restored; price filter inputs are reset to empty; result count returns to original' },
        ],
      },
      {
        title: 'Search with special characters does not cause errors',
        type: 'Edge', priority: 'P2', source: 'ai', is_automated: false,
        description: 'Verify that entering special characters or SQL injection patterns in the search field is handled gracefully.',
        preconditions: 'Application is loaded.',
        steps: [
          { step_number: 1, action: 'Enter "<script>alert(1)</script>" in the search bar and press Enter', expected_outcome: 'Search executes safely; no JavaScript alert is triggered; results show "0 results found" or similar; input is sanitized' },
          { step_number: 2, action: 'Enter "\' OR 1=1 --" in the search bar and press Enter', expected_outcome: 'Search returns 0 results or a "no results" message; no database error is exposed; application remains functional' },
          { step_number: 3, action: 'Enter "laptop & monitor | keyboard" with special operators', expected_outcome: 'Search treats special characters as literal text; results may include products matching any of the words' },
          { step_number: 4, action: 'Enter a very long string (500+ characters) in the search bar', expected_outcome: 'Input is either truncated at the maximum allowed length or search executes without error; no server timeout occurs' },
          { step_number: 5, action: 'Enter emoji characters "🎧 headphones 🎵" and press Enter', expected_outcome: 'Search handles emoji gracefully; returns results for "headphones" if emoji is stripped, or 0 results; no error page' },
        ],
      },
      {
        title: 'Sort search results by different criteria',
        type: 'Positive', priority: 'P2', source: 'manual', is_automated: false,
        description: 'Verify that search results can be sorted by price (low to high, high to low), rating, and newest arrivals.',
        preconditions: 'Search results page is loaded with at least 10 results.',
        steps: [
          { step_number: 1, action: 'Perform a search and locate the sort dropdown (default: "Relevance")', expected_outcome: 'Sort dropdown is visible showing "Relevance" as the selected option' },
          { step_number: 2, action: 'Select "Price: Low to High" from the sort dropdown', expected_outcome: 'Results reorder so the cheapest product appears first; prices increase as you scroll down' },
          { step_number: 3, action: 'Select "Price: High to Low"', expected_outcome: 'Results reorder so the most expensive product appears first; prices decrease as you scroll down' },
          { step_number: 4, action: 'Select "Customer Rating"', expected_outcome: 'Results reorder by rating (highest first); products with 5-star ratings appear at the top' },
          { step_number: 5, action: 'Select "Newest Arrivals"', expected_outcome: 'Results reorder by date added (newest first); recently added products appear at the top' },
          { step_number: 6, action: 'Verify that applying a filter after sorting preserves the sort order', expected_outcome: 'After applying a category filter, results remain sorted by the last selected sort option' },
        ],
      },
    ],
  },
  {
    id: 'sc-3',
    title: 'Shopping Cart & Checkout',
    feature_area: 'E-commerce',
    test_cases: [
      {
        title: 'Add product to cart and verify cart state',
        type: 'Positive', priority: 'P1', source: 'ai', is_automated: false,
        description: 'Verify that adding a product to the cart updates the cart icon badge, persists the item, and shows correct pricing.',
        preconditions: 'User is logged in. Cart is empty. At least one product is available in the catalog.',
        steps: [
          { step_number: 1, action: 'Navigate to a product detail page for "Wireless Bluetooth Headphones" ($79.99)', expected_outcome: 'Product page loads with name, price, description, images, and "Add to Cart" button' },
          { step_number: 2, action: 'Select quantity as 2 using the quantity selector', expected_outcome: 'Quantity updates to 2; no price recalculation shown yet on the product page' },
          { step_number: 3, action: 'Click the "Add to Cart" button', expected_outcome: 'Success toast appears: "Added to cart"; cart icon in the header shows badge with "2"; button text changes to "Added ✓" briefly' },
          { step_number: 4, action: 'Click the cart icon in the header to open the cart drawer/page', expected_outcome: 'Cart opens showing "Wireless Bluetooth Headphones" × 2 at $79.99 each; subtotal shows $159.98' },
          { step_number: 5, action: 'Refresh the page and open the cart again', expected_outcome: 'Cart still contains the same item with quantity 2; cart persists across page refreshes via session/localStorage' },
        ],
      },
      {
        title: 'Complete checkout with credit card payment',
        type: 'Positive', priority: 'P1', source: 'ai', is_automated: false,
        description: 'Verify the end-to-end checkout flow from cart to order confirmation with credit card payment.',
        preconditions: 'User is logged in. Cart contains at least one item. Shipping address is saved in the account.',
        steps: [
          { step_number: 1, action: 'Navigate to the cart page and click "Proceed to Checkout"', expected_outcome: 'Checkout page loads with steps: Shipping → Payment → Review → Confirmation' },
          { step_number: 2, action: 'Select a saved shipping address or enter a new one', expected_outcome: 'Address form validates all required fields (name, street, city, state, zip); "Continue to Payment" button becomes active' },
          { step_number: 3, action: 'Click "Continue to Payment" and enter credit card details (4242 4242 4242 4242, exp 12/28, CVV 123)', expected_outcome: 'Payment form accepts the card; card type (Visa) is auto-detected and icon appears; all fields pass validation' },
          { step_number: 4, action: 'Click "Review Order" to see the order summary', expected_outcome: 'Order review page shows: items list, quantities, subtotal, shipping cost, tax, and total amount; shipping address and payment method (Visa ending in 4242) are displayed' },
          { step_number: 5, action: 'Click "Place Order" to complete the purchase', expected_outcome: 'Loading overlay appears; after processing, order confirmation page shows with order number, estimated delivery date, and "Thank you" message; confirmation email is sent' },
          { step_number: 6, action: 'Verify the order appears in "My Orders" section', expected_outcome: 'Order is listed with status "Processing"; order details match the items purchased' },
        ],
      },
      {
        title: 'Apply discount coupon code at checkout',
        type: 'Positive', priority: 'P2', source: 'manual', is_automated: false,
        description: 'Verify that a valid coupon code is applied correctly and the discount is reflected in the order total.',
        preconditions: 'Cart has items totaling $200+. Valid coupon "SAVE20" exists for 20% off.',
        steps: [
          { step_number: 1, action: 'Navigate to the cart page with items totaling $250.00', expected_outcome: 'Cart shows subtotal of $250.00' },
          { step_number: 2, action: 'Locate the "Promo Code" input field and enter "SAVE20"', expected_outcome: 'Input field accepts the code' },
          { step_number: 3, action: 'Click "Apply" button next to the promo code field', expected_outcome: 'Success message: "Coupon SAVE20 applied — 20% off"; discount line shows "-$50.00"; new subtotal shows $200.00' },
          { step_number: 4, action: 'Try to apply a second coupon code "FREESHIP"', expected_outcome: 'Error message: "Only one coupon can be applied per order" or the new coupon replaces the old one (depending on business rules)' },
          { step_number: 5, action: 'Click the "X" button next to the applied coupon to remove it', expected_outcome: 'Coupon is removed; subtotal returns to $250.00; promo code input field is cleared and available again' },
        ],
      },
      {
        title: 'Cart updates when product goes out of stock',
        type: 'Edge', priority: 'P2', source: 'ai', is_automated: false,
        description: 'Verify that the cart handles out-of-stock scenarios gracefully when a product becomes unavailable after being added.',
        preconditions: 'Product is in the cart. Product inventory is about to be depleted by another user.',
        steps: [
          { step_number: 1, action: 'Add a product with limited stock (e.g., 2 remaining) to the cart with quantity 1', expected_outcome: 'Product is added to cart successfully' },
          { step_number: 2, action: 'Simulate the product going out of stock (another user buys the remaining inventory)', expected_outcome: 'This step simulates a backend inventory change' },
          { step_number: 3, action: 'Navigate to the cart page or refresh it', expected_outcome: 'Cart shows the product with a warning badge: "This item is no longer available" or "Only X left in stock"' },
          { step_number: 4, action: 'Attempt to proceed to checkout with the out-of-stock item', expected_outcome: 'Checkout is blocked with message: "Please remove unavailable items from your cart before proceeding"' },
          { step_number: 5, action: 'Remove the out-of-stock item from the cart', expected_outcome: 'Item is removed; cart updates; if cart is now empty, "Your cart is empty" message is shown with a "Continue Shopping" link' },
        ],
      },
      {
        title: 'Checkout form validation for required fields',
        type: 'Negative', priority: 'P1', source: 'ai', is_automated: false,
        description: 'Verify that the checkout form properly validates all required fields and shows clear error messages.',
        preconditions: 'User is on the checkout shipping address step. Cart has at least one item.',
        steps: [
          { step_number: 1, action: 'Leave all shipping address fields empty and click "Continue to Payment"', expected_outcome: 'Form does not submit; red error borders appear on all required fields; error messages show below each field (e.g., "Full name is required", "Street address is required")' },
          { step_number: 2, action: 'Enter only the full name and click "Continue to Payment"', expected_outcome: 'Remaining empty required fields show errors; the name field error is cleared' },
          { step_number: 3, action: 'Enter an invalid zip code format (e.g., "ABCDE" for US)', expected_outcome: 'Zip code field shows error: "Please enter a valid zip code"' },
          { step_number: 4, action: 'Enter a valid phone number with country code', expected_outcome: 'Phone field validation passes; green checkmark may appear' },
          { step_number: 5, action: 'Fill in all required fields with valid data and click "Continue to Payment"', expected_outcome: 'All error messages are cleared; form submits successfully; user advances to the payment step' },
        ],
      },
    ],
  },
  {
    id: 'sc-4',
    title: 'User Profile & Account Settings',
    feature_area: 'User Management',
    test_cases: [
      {
        title: 'Update profile information successfully',
        type: 'Positive', priority: 'P2', source: 'ai', is_automated: false,
        description: 'Verify that users can update their profile details (name, email, phone) and changes are persisted.',
        preconditions: 'User is logged in and on the profile settings page.',
        steps: [
          { step_number: 1, action: 'Navigate to Settings > Profile from the user dropdown menu', expected_outcome: 'Profile page loads showing current user information in editable fields' },
          { step_number: 2, action: 'Change the display name from "John Doe" to "John M. Doe"', expected_outcome: 'Name field accepts the new value; "Save Changes" button becomes active/highlighted' },
          { step_number: 3, action: 'Update the phone number to "+1 (555) 123-4567"', expected_outcome: 'Phone field accepts the formatted number' },
          { step_number: 4, action: 'Click "Save Changes"', expected_outcome: 'Loading indicator appears on the button; after saving, success toast: "Profile updated successfully"' },
          { step_number: 5, action: 'Navigate away from the page and return to the profile', expected_outcome: 'Updated name "John M. Doe" and phone number are persisted and displayed correctly' },
        ],
      },
      {
        title: 'Change password with validation',
        type: 'Positive', priority: 'P1', source: 'ai', is_automated: false,
        description: 'Verify the change password flow including current password verification and new password strength requirements.',
        preconditions: 'User is logged in. Current password is known.',
        steps: [
          { step_number: 1, action: 'Navigate to Settings > Security > Change Password', expected_outcome: 'Change password form displays with fields: Current Password, New Password, Confirm New Password' },
          { step_number: 2, action: 'Enter the current password correctly', expected_outcome: 'Field accepts input; no immediate validation error' },
          { step_number: 3, action: 'Enter a new password "NewP@ss2024!" that meets all strength requirements', expected_outcome: 'Password strength indicator shows "Strong"; all requirement checkmarks turn green (8+ chars, uppercase, lowercase, number, special char)' },
          { step_number: 4, action: 'Enter the same new password in the "Confirm New Password" field', expected_outcome: 'Passwords match indicator appears; "Update Password" button becomes active' },
          { step_number: 5, action: 'Click "Update Password"', expected_outcome: 'Success message: "Password changed successfully. Please use your new password for future logins." All password fields are cleared.' },
        ],
      },
      {
        title: 'Upload and crop profile avatar image',
        type: 'Positive', priority: 'P3', source: 'ai', is_automated: false,
        description: 'Verify that users can upload a profile picture, crop it, and see the updated avatar across the application.',
        preconditions: 'User is logged in. A JPEG image file (< 5MB) is available for upload.',
        steps: [
          { step_number: 1, action: 'Click on the current profile avatar (or the "Change Photo" link) on the profile page', expected_outcome: 'File upload dialog opens or a modal with upload area appears' },
          { step_number: 2, action: 'Select a JPEG image file (2MB) from the file system', expected_outcome: 'Image preview appears in a crop modal with a circular crop area; zoom and rotation controls are available' },
          { step_number: 3, action: 'Adjust the crop area to frame the face properly and click "Save"', expected_outcome: 'Upload progress bar appears; after completion, the new avatar replaces the old one on the profile page' },
          { step_number: 4, action: 'Navigate to the main application header', expected_outcome: 'The new avatar is displayed in the header navigation bar (top-right corner)' },
          { step_number: 5, action: 'Verify the avatar in a comment or review section', expected_outcome: 'New avatar appears next to any user-generated content (comments, reviews, etc.)' },
        ],
      },
      {
        title: 'Email change requires verification',
        type: 'Positive', priority: 'P1', source: 'manual', is_automated: false,
        description: 'Verify that changing the account email requires verification of the new email address before the change takes effect.',
        preconditions: 'User is logged in with email "john@example.com". Access to the new email inbox is available.',
        steps: [
          { step_number: 1, action: 'Navigate to profile settings and click "Change Email"', expected_outcome: 'Email change form appears requesting current password and new email address' },
          { step_number: 2, action: 'Enter current password and new email "john.new@example.com"', expected_outcome: 'Form validates both fields; "Send Verification" button is active' },
          { step_number: 3, action: 'Click "Send Verification"', expected_outcome: 'Message: "Verification email sent to john.new@example.com. Please check your inbox." Current email remains unchanged until verified.' },
          { step_number: 4, action: 'Open the verification email and click the confirmation link', expected_outcome: 'Browser opens a confirmation page: "Email successfully changed to john.new@example.com"' },
          { step_number: 5, action: 'Log out and log in with the new email address', expected_outcome: 'Login succeeds with the new email; old email no longer works for login' },
        ],
      },
      {
        title: 'Delete account with confirmation flow',
        type: 'Negative', priority: 'P2', source: 'ai', is_automated: false,
        description: 'Verify the account deletion flow requires multiple confirmations and properly removes user data.',
        preconditions: 'User is logged in with an active account.',
        steps: [
          { step_number: 1, action: 'Navigate to Settings > Account > Danger Zone', expected_outcome: 'Red-bordered section shows "Delete Account" with a warning about permanent data loss' },
          { step_number: 2, action: 'Click "Delete My Account"', expected_outcome: 'Confirmation modal appears: "Are you sure? This action cannot be undone. All your data will be permanently deleted."' },
          { step_number: 3, action: 'Type "DELETE" in the confirmation text field as required', expected_outcome: 'Text field validates the input; "Permanently Delete" button becomes active (red)' },
          { step_number: 4, action: 'Enter current password for final verification', expected_outcome: 'Password field accepts input' },
          { step_number: 5, action: 'Click "Permanently Delete"', expected_outcome: 'Account is deleted; user is logged out and redirected to the home page with message: "Your account has been deleted." Attempting to log in with old credentials fails.' },
        ],
      },
    ],
  },
  {
    id: 'sc-5',
    title: 'Responsive UI & Cross-Browser Compatibility',
    feature_area: 'UI/UX',
    test_cases: [
      {
        title: 'Navigation menu collapses to hamburger on mobile',
        type: 'UI Validation', priority: 'P2', source: 'ai', is_automated: false,
        description: 'Verify that the desktop navigation menu transforms into a hamburger menu on mobile viewports.',
        preconditions: 'Application is loaded in a browser with DevTools available for responsive testing.',
        steps: [
          { step_number: 1, action: 'Open the application at full desktop width (1920px)', expected_outcome: 'Full horizontal navigation bar is visible with all menu items (Home, Products, Categories, About, Contact)' },
          { step_number: 2, action: 'Resize the browser window to tablet width (768px)', expected_outcome: 'Navigation items may begin to compress; some items may move to a "More" dropdown' },
          { step_number: 3, action: 'Resize to mobile width (375px)', expected_outcome: 'Navigation bar collapses; hamburger menu icon (☰) appears in the top-left or top-right corner; menu items are hidden' },
          { step_number: 4, action: 'Tap/click the hamburger menu icon', expected_outcome: 'Slide-out or dropdown menu appears with all navigation items stacked vertically; overlay dims the background content' },
          { step_number: 5, action: 'Tap a menu item (e.g., "Products")', expected_outcome: 'Menu closes; user navigates to the Products page; hamburger icon is still visible for future navigation' },
        ],
      },
      {
        title: 'Product images load with lazy loading and placeholders',
        type: 'UI Validation', priority: 'P3', source: 'ai', is_automated: false,
        description: 'Verify that product images use lazy loading with skeleton placeholders for optimal performance.',
        preconditions: 'Application is loaded. Network throttling can be applied via DevTools.',
        steps: [
          { step_number: 1, action: 'Open DevTools and set network throttling to "Slow 3G"', expected_outcome: 'Network speed is throttled to simulate slow connections' },
          { step_number: 2, action: 'Navigate to a product listing page with 20+ products', expected_outcome: 'Page structure loads quickly; product cards show skeleton/placeholder rectangles where images will appear' },
          { step_number: 3, action: 'Observe the images loading as you scroll down', expected_outcome: 'Images load progressively as they enter the viewport (lazy loading); skeleton placeholders are replaced with actual images' },
          { step_number: 4, action: 'Scroll quickly to the bottom of the page', expected_outcome: 'Images near the bottom have not loaded yet (confirming lazy loading); they begin loading as they approach the viewport' },
          { step_number: 5, action: 'Verify a broken image scenario by blocking an image URL in DevTools', expected_outcome: 'Broken image shows a fallback placeholder (e.g., a generic product icon) instead of the browser\'s broken image icon' },
        ],
      },
      {
        title: 'Form inputs are accessible with keyboard navigation',
        type: 'Positive', priority: 'P2', source: 'manual', is_automated: false,
        description: 'Verify that all form inputs can be navigated and operated using only the keyboard (Tab, Enter, Space, Arrow keys).',
        preconditions: 'Login page or any form page is loaded. Mouse is not used.',
        steps: [
          { step_number: 1, action: 'Press Tab from the top of the page to navigate to the first form field', expected_outcome: 'Focus ring (visible outline) appears on the first input field; screen reader announces the field label' },
          { step_number: 2, action: 'Continue pressing Tab to move through all form fields', expected_outcome: 'Focus moves sequentially through: email field → password field → "Remember me" checkbox → "Sign In" button → "Forgot password" link' },
          { step_number: 3, action: 'Press Space on the "Remember me" checkbox', expected_outcome: 'Checkbox toggles its checked state; visual checkmark appears or disappears' },
          { step_number: 4, action: 'Press Shift+Tab to move focus backwards', expected_outcome: 'Focus moves to the previous element in reverse tab order' },
          { step_number: 5, action: 'Press Enter on the "Sign In" button while focused', expected_outcome: 'Form submits as if the button was clicked; same behavior as mouse click' },
        ],
      },
      {
        title: 'Dark mode toggle applies theme consistently',
        type: 'UI Validation', priority: 'P3', source: 'ai', is_automated: false,
        description: 'Verify that toggling dark mode applies the dark theme consistently across all pages and components.',
        preconditions: 'Application supports dark mode. Currently in light mode.',
        steps: [
          { step_number: 1, action: 'Locate the dark mode toggle in the settings or header', expected_outcome: 'Toggle switch or icon (sun/moon) is visible and in "light mode" state' },
          { step_number: 2, action: 'Click the dark mode toggle', expected_outcome: 'Background changes to dark (#1a1a2e or similar); text changes to light (#e0e0e0); toggle icon switches to moon/sun' },
          { step_number: 3, action: 'Navigate through multiple pages (home, product listing, product detail, cart)', expected_outcome: 'Dark theme is consistently applied on all pages; no white flashes during navigation; all text remains readable' },
          { step_number: 4, action: 'Check form inputs and buttons in dark mode', expected_outcome: 'Input fields have dark backgrounds with light text and visible borders; buttons maintain their brand colors with sufficient contrast' },
          { step_number: 5, action: 'Refresh the page', expected_outcome: 'Dark mode preference is persisted; page reloads in dark mode without briefly showing light mode' },
        ],
      },
      {
        title: 'Page layout handles content overflow gracefully',
        type: 'Edge', priority: 'P3', source: 'ai', is_automated: false,
        description: 'Verify that extremely long text content, large numbers, and edge-case data do not break the page layout.',
        preconditions: 'Application is loaded. Test data with extreme values is available.',
        steps: [
          { step_number: 1, action: 'View a product with a very long name (100+ characters)', expected_outcome: 'Product name is truncated with ellipsis (...) or wraps gracefully within its container; layout is not broken' },
          { step_number: 2, action: 'View a product with a price of $999,999.99', expected_outcome: 'Price is formatted correctly with commas and decimal; price badge/container accommodates the large number without overflow' },
          { step_number: 3, action: 'View a product description with 5000+ characters', expected_outcome: 'Description is either truncated with a "Read more" link or contained within a scrollable area; page layout remains intact' },
          { step_number: 4, action: 'View a user review with no text (rating only)', expected_outcome: 'Review card displays the star rating without empty space where text would be; layout adjusts gracefully' },
          { step_number: 5, action: 'View a page with 0 results (empty state)', expected_outcome: 'Empty state illustration and message are centered; no broken layout or missing elements; call-to-action button is provided' },
        ],
      },
    ],
  },
];

function buildDummyPlan(planId, overrides = {}) {
  const now = new Date();
  const past = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);
  const totalTc = DUMMY_SCENARIOS.reduce((acc, s) => acc + (s.test_cases?.length || 0), 0);
  return {
    id: planId,
    _id: planId,
    url: overrides.url || 'https://example.com',
    prompt: overrides.prompt || 'Create a comprehensive test plan for this website.',
    user_prompt: overrides.prompt || overrides.user_prompt,
    status: overrides.status || 'completed',
    mode: overrides.mode || 'planner',
    total_scenarios: DUMMY_SCENARIOS.length,
    total_test_cases: totalTc,
    scenarios: overrides.scenarios ?? DUMMY_SCENARIOS,
    created_at: overrides.created_at || past.toISOString(),
    updated_at: overrides.updated_at || now.toISOString(),
    ...overrides,
  };
}

function buildDummyManualPlan(planId, overrides = {}) {
  const now = new Date();
  const past = new Date(now.getTime() - 1.5 * 60 * 60 * 1000);
  const scenarios = overrides.scenarios ?? DUMMY_SCENARIOS.map((s, i) => ({
    ...s,
    id: s.id || `SC-${i + 1}`,
    scenario_title: s.title,
    scenario_description: s.feature_area,
    test_cases: (s.test_cases || []).map((tc) => ({
      ...tc,
      priority_label: tc.priority,
      scenario_description: tc.description,
    })),
  }));
  const totalTc = scenarios.reduce((acc, s) => acc + (s.test_cases?.length || 0), 0);
  return {
    id: planId,
    _id: planId,
    url: 'Manual Context',
    prompt: overrides.prompt || 'Generate manual test cases',
    user_prompt: overrides.prompt || overrides.user_prompt,
    status: overrides.status || 'completed',
    mode: 'manual',
    total_scenarios: scenarios.length,
    total_test_cases: totalTc,
    scenarios,
    created_at: overrides.created_at || past.toISOString(),
    updated_at: overrides.updated_at || now.toISOString(),
    ...overrides,
  };
}

/** Called by dummy useSSE when stream "completes" to persist the plan for getPlan/getManualPlan */
export function __dummyCompletePlan(planId, mode, planDoc) {
  if (mode === 'manual') {
    manualPlansStore.set(planId, { ...planDoc, id: planId });
  } else {
    plansStore.set(planId, { ...planDoc, id: planId });
  }
}

// Seed recent plans
const seedPlan1 = buildDummyPlan('plan-demo-1', { created_at: new Date(Date.now() - 86400000).toISOString() });
const seedPlan2 = buildDummyManualPlan('plan-demo-manual-1', { prompt: 'Login and logout manual test cases', created_at: new Date(Date.now() - 172800000).toISOString() });
plansStore.set(seedPlan1.id, seedPlan1);
manualPlansStore.set(seedPlan2.id, seedPlan2);

// ——— Test Manager: in-memory folders (mutable for edit/delete) ———
let testManagerFolders = [
  {
    _id: 'tm-1',
    plan_id: seedPlan1.id,
    root_folder_name: 'E-Commerce Platform Test Suite',
    scenarios: JSON.parse(JSON.stringify(DUMMY_SCENARIOS)),
  },
];

function getPlansList(store) {
  return Array.from(store.values()).map((p) => ({
    id: p.id,
    _id: p.id,
    title: p.title || p.prompt?.slice(0, 50) || p.url,
    url: p.url,
    prompt: p.prompt,
    user_prompt: p.user_prompt,
    status: p.status,
    created_at: p.created_at,
  }));
}

// ——— API surface (no network) ———

export const api = { get: async () => ({ data: {} }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }) };

export const listPlans = async () => getPlansList(plansStore);

export const getPlan = async (planId) => {
  let plan = plansStore.get(planId);
  if (!plan) {
    plan = buildDummyPlan(planId);
    plansStore.set(planId, plan);
  }
  return { ...plan, id: plan.id || plan._id };
};

export const createPlan = async (planData) => {
  const id = planData.id || generatePlanId();
  const plan = buildDummyPlan(id, { ...planData, status: 'completed' });
  plansStore.set(id, plan);
  return { id, ...plan };
};

export const stopPlan = async () => ({ ok: true });

export const getPlanMessages = async (planId) => {
  const plan = plansStore.get(planId);
  const prompt = plan?.prompt || plan?.user_prompt || 'Create test plan';
  return {
    messages: [
      { method: 'conversation', role: 'user', content: prompt, timestamp: new Date().toISOString() },
      { method: 'conversation', role: 'assistant', content: 'Test plan generation completed successfully.', type: 'plan_completed', timestamp: new Date().toISOString() },
    ],
  };
};

export const getPlanSummary = async (planId) => {
  const plan = await getPlan(planId);
  return { ...plan, coverage: { by_type: { Positive: 10, Negative: 5, Edge: 5, 'UI Validation': 5 }, by_priority: { P1: 8, P2: 10, P3: 7 } } };
};

export const getExportUrl = () => '#';

export const getStreamUrl = () => '#';

export const generatePlanId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `plan-${timestamp}${random}`;
};

export const exportToTestManager = async (exportData) => {
  const { plan_id, root_folder_name, scenarios } = exportData;
  if (!plan_id || !scenarios || scenarios.length === 0) return { ok: true };

  const folder = {
    _id: `tm-${Date.now()}`,
    plan_id,
    root_folder_name: root_folder_name || `Exported Plan ${plan_id}`,
    scenarios: JSON.parse(JSON.stringify(scenarios))
  };

  testManagerFolders.push(folder);
  return { ok: true };
};

export const getTestManagerData = async () => ({ folders: JSON.parse(JSON.stringify(testManagerFolders)) });

export const listManualPlans = async () => getPlansList(manualPlansStore);

export const getManualPlan = async (planId) => {
  let plan = manualPlansStore.get(planId);
  if (!plan) {
    plan = buildDummyManualPlan(planId);
    manualPlansStore.set(planId, plan);
  }
  return { ...plan, id: plan.id || plan._id };
};

export const getManualPlanMessages = async (planId) => {
  const plan = manualPlansStore.get(planId);
  const prompt = plan?.prompt || plan?.user_prompt || 'Generate manual test cases';
  return {
    messages: [
      { method: 'conversation', role: 'user', content: prompt, timestamp: new Date().toISOString() },
      { method: 'conversation', role: 'assistant', content: 'Manual test cases generated.', type: 'plan_completed', timestamp: new Date().toISOString() },
    ],
  };
};

export const getManualPlanSummary = async (planId) => {
  const plan = await getManualPlan(planId);
  return { ...plan };
};

export const deletePlan = async (planId) => {
  plansStore.delete(planId);
  return { ok: true };
};

export const deleteManualPlan = async (planId) => {
  manualPlansStore.delete(planId);
  return { ok: true };
};

export const deleteTestCase = async (planId, scenarioTitle, tcTitle) => {
  const folder = testManagerFolders.find((f) => f.plan_id === planId);
  if (folder?.scenarios) {
    const scenario = folder.scenarios.find((s) => s.title === scenarioTitle);
    if (scenario?.test_cases) {
      scenario.test_cases = scenario.test_cases.filter((tc) => tc.title !== tcTitle);
    }
  }
  return { ok: true };
};

export const updateTestCase = async (planId, scenarioTitle, tcTitle, updatedData) => {
  const folder = testManagerFolders.find((f) => f.plan_id === planId);
  if (folder?.scenarios) {
    const scenario = folder.scenarios.find((s) => s.title === scenarioTitle);
    const tc = scenario?.test_cases?.find((t) => t.title === tcTitle);
    if (tc) Object.assign(tc, updatedData);
  }
  return { ok: true };
};
