import { useState } from 'react';

import { useBottomSheet } from '../../hooks';

/**
 * BottomSheetExample - Demonstrates bottom sheet functionality
 */
const BottomSheetExample = () => {
  const [showBasic, setShowBasic] = useState(false);
  const [showWithForm, setShowWithForm] = useState(false);
  
  const {
    isOpen: isResponsiveOpen,
    open: openResponsive,
    close: closeResponsive,
    isMobile,
  } = useBottomSheet();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Bottom Sheet Examples
      </h2>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Device: {isMobile ? 'Mobile' : 'Desktop'}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Bottom Sheet */}
        <Button onClick={() => setShowBasic(true)}>
          Basic Bottom Sheet
        </Button>

        {/* Bottom Sheet with Form */}
        <Button onClick={() => setShowWithForm(true)}>
          Bottom Sheet with Form
        </Button>

        {/* Responsive Modal */}
        <Button onClick={openResponsive}>
          Responsive Modal
        </Button>
      </div>

      {/* Basic Bottom Sheet */}
      <BottomSheet
        isOpen={showBasic}
        onClose={() => setShowBasic(false)}
        title="Basic Bottom Sheet"
        height="auto"
      >
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This is a basic bottom sheet with auto height. It will slide up from the bottom
            on mobile devices and show as a modal on desktop.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You can swipe down to dismiss it on mobile, or click the backdrop.
          </p>
          <Button onClick={() => setShowBasic(false)}>
            Close
          </Button>
        </div>
      </BottomSheet>

      {/* Bottom Sheet with Form */}
      <BottomSheet
        isOpen={showWithForm}
        onClose={() => setShowWithForm(false)}
        title="Recipe Quick Add"
        height="half"
        swipeToClose={true}
      >
        <div className="p-6">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipe Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter recipe name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Cocktails</option>
                <option>Mocktails</option>
                <option>Shots</option>
                <option>Punches</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Save Recipe
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowWithForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </BottomSheet>

      {/* Responsive Modal */}
      <ResponsiveModal
        isOpen={isResponsiveOpen}
        onClose={closeResponsive}
        title="Responsive Modal"
        size="md"
        height="auto"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Automatic Device Detection
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This modal automatically switches between:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 mb-6">
            <li><strong>Mobile:</strong> Bottom sheet with swipe gestures</li>
            <li><strong>Desktop:</strong> Traditional centered modal</li>
            <li><strong>Tablet:</strong> Adapts based on orientation</li>
          </ul>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Current mode:</strong> {isMobile ? 'Bottom Sheet (Mobile)' : 'Modal (Desktop)'}
            </p>
          </div>

          <Button onClick={closeResponsive} className="w-full">
            Close Modal
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
};

export default BottomSheetExample;
