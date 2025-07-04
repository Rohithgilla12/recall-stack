import React, { useState, useEffect, useCallback } from "react";

interface PageDetails {
  url?: string;
  title?: string;
  selectionText?: string;
}

interface TagInputUIProps {
  initialPageDetails: PageDetails; // Though not directly used in UI, passed to onSubmit
  onSubmit: (tags: string[], pageDetails: PageDetails) => void;
  onClose: () => void;
}

const TagInputUI: React.FC<TagInputUIProps> = ({ initialPageDetails, onSubmit, onClose }) => {
  const [tags, setTags] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [userInput, setUserInput] = useState(false); // To check if user interacted

  const handleSubmit = useCallback(() => {
    const tagArray = tags.split(",").map(tag => tag.trim()).filter(tag => tag);
    onSubmit(tagArray, initialPageDetails);
    onClose(); // Close after submit
  }, [tags, onSubmit, onClose, initialPageDetails]);

  useEffect(() => {
    const inputElement = document.getElementById("recall-stack-tag-input-field-react") as HTMLInputElement | null;
    if (inputElement) {
      inputElement.focus();
    }

    if (countdown <= 0 && !userInput) { // If countdown finishes and no user input, submit (effectively an "auto-save" with potentially no tags)
        handleSubmit();
        return;
    }

    if (countdown <= 0 && userInput) { // If countdown finishes AND user has typed, also submit
        handleSubmit();
        return;
    }


    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, handleSubmit, userInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTags(e.target.value);
    if (!userInput) {
      setUserInput(true); // Mark that user has started typing
    }
  }

  const handleManualSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    handleSubmit();
  };

  // Use a keydown listener on the input for Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission if it's part of a form
      handleSubmit();
    }
  };


  return (
    <div className="fixed top-5 right-5 bg-white p-6 rounded-lg shadow-xl border border-gray-200 z-[2147483647] w-80 text-sm font-sans">
      <form onSubmit={handleManualSubmit}>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Add Tags (Optional)</h3>
        <input
          id="recall-stack-tag-input-field-react"
          type="text"
          value={tags}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter tags, comma-separated"
          className="w-full p-2 border border-gray-300 rounded-md mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out"
        >
          Save Bookmark
        </button>
        {countdown > 0 && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Auto-saving in {countdown}s...
          </p>
        )}
         {countdown <= 0 && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Saving...
          </p>
        )}
      </form>
    </div>
  );
};

export default TagInputUI;
