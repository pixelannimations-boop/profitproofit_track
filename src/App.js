import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  runTransaction,
  getDoc,
  setDoc,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBXXvsxMWhczrXiDAZWDUMac9JN5ao9Gi4",
  authDomain: "tracker-ecad4.firebaseapp.com",
  projectId: "tracker-ecad4",
  storageBucket: "tracker-ecad4.firebasestorage.app",
  messagingSenderId: "30000394986",
  appId: "1:30000394986:web:19ad128eda8b4fa5d7dd93",
  measurementId: "G-RRL5XMR90W",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Helper Functions ---
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const exportToCSV = (data, filename) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          let cell =
            row[header] === null || row[header] === undefined
              ? ""
              : String(row[header]);
          cell = cell.includes(",") ? `"${cell}"` : cell;
          return cell;
        })
        .join(",")
    ),
  ];
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// --- Custom Hooks ---
const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

// --- SVG Icons ---
const HomeIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const PackageIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const CreditCardIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const SparklesIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
const TrendingUpIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const PlusCircleIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const BarChart2Icon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const SettingsIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const TrophyIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
const DownloadIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const EditIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);
const TrashIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const LifeBuoyIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
    <line x1="14.83" y1="9.17" x2="18.36" y2="5.64" />
    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
  </svg>
);
const InfoIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const SearchIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const CalculatorIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="16" x2="16" y1="14" y2="18" />
    <line x1="16" x2="12" y1="14" y2="14" />
    <line x1="12" x2="12" y1="14" y2="18" />
    <line x1="8" x2="8" y1="14" y2="18" />
  </svg>
);
const UploadIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const CarIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M6 17h10" />
    <path d="M5 11h14" />
  </svg>
);
const ArrowUpDownIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m21 16-4 4-4-4" />
    <path d="M17 20V4" />
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
  </svg>
);

// --- Components ---

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const ConfirmDeleteModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;
  return (
    <Modal show={show} onClose={onClose} title={title}>
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
};

const ImportCSVModal = ({ show, onClose, onImport, type }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await onImport(file);
      onClose();
    } catch (err) {
      setError("Error processing file. Please check the format.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleFormats = {
    sales: "item,date,platform,salePrice,shipping,fees,cogs",
    inventory: "name,sku,stock,cogs,listedPrice,platform",
  };

  return (
    <Modal show={show} onClose={onClose} title={`Import ${type} from CSV`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Upload a CSV file with your {type} data. The first row must be a
          header row with the exact column names in the correct order.
        </p>
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-xs text-gray-300 font-mono break-words">
            {sampleFormats[type]}
          </p>
        </div>
        {error && <p className="text-red-400">{error}</p>}
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
        />
        <button
          onClick={handleImport}
          disabled={isLoading || !file}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {isLoading ? "Importing..." : "Import"}
        </button>
      </div>
    </Modal>
  );
};

const AddSaleForm = ({ userId, onAdd, inventory, saleToEdit, onSave }) => {
  const [entryMode, setEntryMode] = useState("inventory");
  const [inventoryId, setInventoryId] = useState("");
  const [manualItemName, setManualItemName] = useState("");
  const [manualCogs, setManualCogs] = useState("");
  const [platform, setPlatform] = useState("eBay");
  const [salePrice, setSalePrice] = useState("");
  const [shipping, setShipping] = useState("");
  const [fees, setFees] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [isEbayFeeAuto, setIsEbayFeeAuto] = useState(false);

  const isEditMode = !!saleToEdit;

  useEffect(() => {
    if (isEditMode) {
      setEntryMode(saleToEdit.inventoryId ? "inventory" : "manual");
      setInventoryId(saleToEdit.inventoryId || "");
      setManualItemName(saleToEdit.inventoryId ? "" : saleToEdit.item);
      setManualCogs(saleToEdit.inventoryId ? "" : saleToEdit.cogs);
      setPlatform(saleToEdit.platform);
      setSalePrice(saleToEdit.salePrice);
      setShipping(saleToEdit.shipping);
      setFees(saleToEdit.fees);
      setDate(saleToEdit.date);
    }
  }, [saleToEdit, isEditMode]);

  const EBAY_FEE_PERCENTAGE = 0.1325;

  useEffect(() => {
    if (platform === "eBay" && isEbayFeeAuto) {
      const price = parseFloat(salePrice) || 0;
      const shippingCost = parseFloat(shipping) || 0;
      const totalSale = price + shippingCost;
      const calculatedFee = totalSale * EBAY_FEE_PERCENTAGE;
      setFees(calculatedFee.toFixed(2));
    }
  }, [salePrice, shipping, platform, isEbayFeeAuto]);

  useEffect(() => {
    if (platform !== "eBay") setIsEbayFeeAuto(false);
  }, [platform]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isEditMode) {
      const updatedSale = {
        ...saleToEdit,
        platform,
        date,
        salePrice: parseFloat(salePrice),
        shipping: parseFloat(shipping),
        fees: parseFloat(fees),
      };
      await updateDoc(
        doc(db, "artifacts", appId, "users", userId, "sales", saleToEdit.id),
        updatedSale
      );
      onSave();
    } else {
      if (entryMode === "inventory") {
        if (!inventoryId) {
          setError("Please select an item from your inventory.");
          return;
        }
        const selectedItem = inventory.find((i) => i.id === inventoryId);
        if (!selectedItem) {
          setError("Selected inventory item not found.");
          return;
        }

        try {
          const inventoryDocRef = doc(
            db,
            "artifacts",
            appId,
            "users",
            userId,
            "inventory",
            inventoryId
          );
          await runTransaction(db, async (transaction) => {
            const inventoryDoc = await transaction.get(inventoryDocRef);
            if (!inventoryDoc.exists())
              throw "Inventory document does not exist!";
            const currentStock = inventoryDoc.data().stock;
            if (currentStock <= 0) throw "This item is out of stock!";
            transaction.update(inventoryDocRef, { stock: currentStock - 1 });

            const salesCollectionRef = collection(
              db,
              "artifacts",
              appId,
              "users",
              userId,
              "sales"
            );
            const newSale = {
              platform,
              item: selectedItem.name,
              inventoryId: selectedItem.id,
              date,
              salePrice: parseFloat(salePrice),
              shipping: parseFloat(shipping),
              fees: parseFloat(fees),
              cogs: selectedItem.cogs,
            };
            transaction.set(doc(salesCollectionRef), newSale);
          });
          onAdd();
        } catch (err) {
          console.error("Transaction failed: ", err);
          setError(err.toString());
        }
      } else {
        // Manual Entry
        if (!manualItemName || !manualCogs) {
          setError("Please enter both Item Name and Cost of Goods.");
          return;
        }
        try {
          const newSale = {
            platform,
            item: manualItemName,
            date,
            salePrice: parseFloat(salePrice),
            shipping: parseFloat(shipping),
            fees: parseFloat(fees),
            cogs: parseFloat(manualCogs),
          };
          await addDoc(
            collection(db, "artifacts", appId, "users", userId, "sales"),
            newSale
          );
          onAdd();
        } catch (err) {
          console.error("Manual sale failed: ", err);
          setError(err.toString());
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>
      )}

      {!isEditMode && (
        <div className="flex bg-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setEntryMode("inventory")}
            className={`w-1/2 p-2 rounded-md text-sm font-semibold transition ${
              entryMode === "inventory"
                ? "bg-indigo-600 text-white"
                : "text-gray-300"
            }`}
          >
            From Inventory
          </button>
          <button
            type="button"
            onClick={() => setEntryMode("manual")}
            className={`w-1/2 p-2 rounded-md text-sm font-semibold transition ${
              entryMode === "manual"
                ? "bg-indigo-600 text-white"
                : "text-gray-300"
            }`}
          >
            Manual Entry
          </button>
        </div>
      )}

      {entryMode === "inventory" ? (
        <select
          value={inventoryId}
          onChange={(e) => setInventoryId(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg"
          required
          disabled={isEditMode}
        >
          <option value="">Select an inventory item...</option>
          {inventory
            .filter(
              (i) =>
                i.stock > 0 || (isEditMode && i.id === saleToEdit.inventoryId)
            )
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.stock} in stock)
              </option>
            ))}
        </select>
      ) : (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Item Name"
            value={manualItemName}
            onChange={(e) => setManualItemName(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg"
            required
            disabled={isEditMode}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Cost of Goods"
            value={manualCogs}
            onChange={(e) => setManualCogs(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg"
            required
            disabled={isEditMode}
          />
        </div>
      )}

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
      />
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
      >
        <option>eBay</option>
        <option>Etsy</option>
        <option>Shopify</option>
        <option>Other</option>
      </select>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          step="0.01"
          placeholder="Sale Price"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg"
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Shipping Cost"
          value={shipping}
          onChange={(e) => setShipping(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg"
          required
        />
      </div>
      <div>
        <input
          type="number"
          step="0.01"
          placeholder="Platform Fees"
          value={fees}
          onChange={(e) => setFees(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg"
          required
          readOnly={platform === "eBay" && isEbayFeeAuto}
        />
        {platform === "eBay" && (
          <div className="flex items-center mt-2">
            <input
              id="auto-fee"
              type="checkbox"
              checked={isEbayFeeAuto}
              onChange={() => setIsEbayFeeAuto(!isEbayFeeAuto)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="auto-fee"
              className="ml-2 block text-sm text-gray-300"
            >
              Auto-calculate eBay Fee (13.25%)
            </label>
          </div>
        )}
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg"
      >
        {isEditMode ? "Save Changes" : "Add Sale"}
      </button>
    </form>
  );
};

const AddInventoryForm = ({ userId, onAdd, itemToEdit, onSave }) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [cogs, setCogs] = useState("");
  const [listedPrice, setListedPrice] = useState("");
  const [platform, setPlatform] = useState("eBay");

  const isEditMode = !!itemToEdit;

  useEffect(() => {
    if (isEditMode) {
      setName(itemToEdit.name);
      setSku(itemToEdit.sku);
      setStock(itemToEdit.stock);
      setCogs(itemToEdit.cogs);
      setListedPrice(itemToEdit.listedPrice);
      setPlatform(itemToEdit.platform);
    }
  }, [itemToEdit, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemData = {
      name,
      sku,
      stock: parseInt(stock, 10),
      cogs: parseFloat(cogs),
      listedPrice: parseFloat(listedPrice),
      platform,
    };

    if (isEditMode) {
      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          userId,
          "inventory",
          itemToEdit.id
        ),
        itemData
      );
      onSave();
    } else {
      itemData.listedDate = new Date().toISOString().split("T")[0];
      await addDoc(
        collection(db, "artifacts", appId, "users", userId, "inventory"),
        itemData
      );
      onAdd();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
        required
      />
      <input
        type="text"
        placeholder="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Quantity"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg"
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Cost per Item (COG)"
          value={cogs}
          onChange={(e) => setCogs(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg"
          required
        />
      </div>
      <input
        type="number"
        step="0.01"
        placeholder="Listed Price per Item"
        value={listedPrice}
        onChange={(e) => setListedPrice(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
        required
      />
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
      >
        <option>eBay</option>
        <option>Etsy</option>
        <option>Shopify</option>
        <option>Other</option>
      </select>
      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg"
      >
        {isEditMode ? "Save Changes" : "Add Inventory"}
      </button>
    </form>
  );
};

const AddExpenseForm = ({ userId, onAdd, expenseToEdit, onSave }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Supplies");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const isEditMode = !!expenseToEdit;

  useEffect(() => {
    if (isEditMode) {
      setName(expenseToEdit.name);
      setCategory(expenseToEdit.category);
      setAmount(expenseToEdit.amount);
      setDate(expenseToEdit.date);
      setNotes(expenseToEdit.notes || "");
    }
  }, [expenseToEdit, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const expenseData = {
      name,
      category,
      amount: parseFloat(amount),
      date,
      notes,
    };
    if (isEditMode) {
      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "users",
          userId,
          "expenses",
          expenseToEdit.id
        ),
        expenseData
      );
      onSave();
    } else {
      await addDoc(
        collection(db, "artifacts", appId, "users", userId, "expenses"),
        expenseData
      );
      onAdd();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Expense Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
        required
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
      >
        <option>Supplies</option>
        <option>Software</option>
        <option>Advertising</option>
        <option>Other</option>
      </select>
      <input
        type="number"
        step="0.01"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
        required
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
        required
      />
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg h-24"
      />
      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg"
      >
        {isEditMode ? "Save Changes" : "Add Expense"}
      </button>
    </form>
  );
};

const DonutChart = ({ data, showLabels = true }) => {
  const colors = ["#667EEA", "#ED64A6", "#4FD1C5", "#F6E05E", "#A0AEC0"];
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) return <p className="text-gray-400">No data available.</p>;

  let cumulative = 0;
  const segments = data.map((d, i) => {
    const percentage = d.value / total;
    const startAngle = (cumulative / total) * 360;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 360;
    return {
      ...d,
      percentage,
      startAngle,
      endAngle,
      color: colors[i % colors.length],
    };
  });

  const getCoords = (angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [50 + 40 * Math.cos(rad), 50 + 40 * Math.sin(rad)];
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-48 h-48">
        {segments.map((seg) => {
          const [startX, startY] = getCoords(seg.startAngle);
          const [endX, endY] = getCoords(seg.endAngle);
          const largeArcFlag = seg.percentage > 0.5 ? 1 : 0;
          const pathData = `M ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`;
          return (
            <path
              key={seg.label}
              d={pathData}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
            />
          );
        })}
      </svg>
      {showLabels && (
        <div className="mt-4 md:mt-0 md:ml-6 space-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center text-sm">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: seg.color }}
              ></span>
              <span className="text-gray-300">{seg.label}:</span>
              <span className="font-semibold text-white ml-auto">
                {(seg.percentage * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BarLineChart = ({ data }) => {
  const width = 500;
  const height = 250;
  const margin = { top: 20, right: 50, bottom: 30, left: 50 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
  const maxProfit = Math.max(...data.map((d) => d.profit), 0);
  const minProfit = Math.min(...data.map((d) => d.profit), 0);
  const yMax = Math.max(maxRevenue, maxProfit);
  const yMin = minProfit < 0 ? minProfit : 0;
  const yRange = yMax - yMin;

  const getX = (index) => margin.left + (index * w) / (data.length - 1);
  const getBarX = (index) => margin.left + (index * w) / data.length;
  const barWidth = (w / data.length) * 0.7;

  const getY = (value) => margin.top + h - ((value - yMin) / yRange) * h;

  if (data.every((d) => d.revenue === 0 && d.profit === 0)) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No performance data for this period.
      </div>
    );
  }

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.profit)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Y Axis Grid Lines & Labels */}
      {Array.from({ length: 5 }).map((_, i) => {
        const value = yMin + (yRange / 4) * i;
        const y = getY(value);
        return (
          <g key={i}>
            <line
              x1={margin.left}
              y1={y}
              x2={width - margin.right}
              y2={y}
              stroke="#374151"
            />
            <text
              x={margin.left - 8}
              y={y + 3}
              textAnchor="end"
              fill="#9CA3AF"
              fontSize="10"
            >
              {formatCurrency(value).replace(".00", "")}
            </text>
          </g>
        );
      })}
      {/* X Axis Labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={getBarX(i) + barWidth / 2}
          y={height - 5}
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize="10"
        >
          {d.label}
        </text>
      ))}

      {/* Bars for Revenue */}
      {data.map((d, i) => (
        <rect
          key={i}
          x={getBarX(i)}
          y={getY(d.revenue)}
          width={barWidth}
          height={getY(0) - getY(d.revenue)}
          fill="#4C51BF"
        />
      ))}

      {/* Line for Profit */}
      <path d={linePath} fill="none" stroke="#ED64A6" strokeWidth="2" />
      {data.map((d, i) => (
        <circle key={i} cx={getX(i)} cy={getY(d.profit)} r="3" fill="#ED64A6" />
      ))}
    </svg>
  );
};

const StatCard = ({ title, value, tooltip, size = "large" }) => {
  const sizeClasses = { large: "p-6", small: "p-4" };
  const titleSizeClasses = { large: "text-sm", small: "text-xs" };
  const valueSizeClasses = { large: "text-3xl mt-1", small: "text-2xl mt-1" };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg ${sizeClasses[size]}`}>
      <h3
        className={`font-medium text-gray-400 flex items-center ${titleSizeClasses[size]}`}
      >
        {title}
        {tooltip && (
          <span className="ml-2 group relative">
            <InfoIcon className="w-4 h-4" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-600 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {tooltip}
            </span>
          </span>
        )}
      </h3>
      <p className={`font-bold text-white ${valueSizeClasses[size]}`}>
        {value}
      </p>
    </div>
  );
};

const Dashboard = ({ sales, expenses, goals, returns }) => {
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce(
      (acc, sale) => acc + (sale.salePrice || 0),
      0
    );
    const totalShipping = sales.reduce(
      (acc, sale) => acc + (sale.shipping || 0),
      0
    );
    const totalFees = sales.reduce((acc, sale) => acc + (sale.fees || 0), 0);
    const totalCogs = sales.reduce((acc, sale) => acc + (sale.cogs || 0), 0);
    const totalExpenses = expenses.reduce(
      (acc, expense) => acc + (expense.amount || 0),
      0
    );

    const returnsImpact = returns.reduce((acc, ret) => {
      const originalSale = sales.find((s) => s.id === ret.saleId);
      if (!originalSale) return acc;
      return (
        acc +
        ((originalSale.salePrice || 0) -
          (originalSale.cogs || 0) -
          (originalSale.fees || 0) -
          (originalSale.shipping || 0))
      );
    }, 0);

    const grossProfit = totalRevenue - totalCogs;
    const netProfit =
      grossProfit - totalFees - totalExpenses - totalShipping - returnsImpact;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    return { totalRevenue, netProfit, profitMargin, totalExpenses };
  }, [sales, expenses, returns]);

  const performanceData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleString("default", { month: "short" }),
      };
    }).reverse();

    return months.map((m) => {
      const monthlySales = sales.filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      });
      const monthlyExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      });
      const monthlyReturns = returns.filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      });

      const revenue = monthlySales.reduce((acc, s) => acc + s.salePrice, 0);
      const cogs = monthlySales.reduce((acc, s) => acc + s.cogs, 0);
      const fees = monthlySales.reduce(
        (acc, s) => acc + s.fees + s.shipping,
        0
      );
      const expenseTotal = monthlyExpenses.reduce(
        (acc, e) => acc + e.amount,
        0
      );
      const returnsImpact = monthlyReturns.reduce((acc, ret) => {
        const originalSale = sales.find((s) => s.id === ret.saleId);
        if (!originalSale) return acc;
        return (
          acc +
          ((originalSale.salePrice || 0) -
            (originalSale.cogs || 0) -
            (originalSale.fees || 0) -
            (originalSale.shipping || 0))
        );
      }, 0);

      const profit = revenue - cogs - fees - expenseTotal - returnsImpact;
      return { label: m.label, revenue, profit };
    });
  }, [sales, expenses, returns]);

  const expenseBreakdown = useMemo(() => {
    const breakdown = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) acc[exp.category] = 0;
      acc[exp.category] += exp.amount;
      return acc;
    }, {});
    return Object.entries(breakdown)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const salesByPlatform = useMemo(() => {
    const platformData = sales.reduce((acc, sale) => {
      if (!acc[sale.platform]) acc[sale.platform] = 0;
      acc[sale.platform] += sale.salePrice;
      return acc;
    }, {});
    return Object.entries(platformData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
        />
        <StatCard title="Net Profit" value={formatCurrency(stats.netProfit)} />
        <StatCard
          title="Profit Margin"
          value={`${stats.profitMargin.toFixed(2)}%`}
        />
        <StatCard
          title="Business Expenses"
          value={formatCurrency(stats.totalExpenses)}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">
            Monthly Performance
          </h2>
          <BarLineChart data={performanceData} />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Expense Breakdown
            </h2>
            <DonutChart data={expenseBreakdown} />
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Sales by Platform
            </h2>
            {sales.length === 0 ? (
              <p className="text-gray-400">No sales data yet.</p>
            ) : (
              <div className="space-y-4">
                {salesByPlatform.map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between items-center text-gray-300 mb-1">
                      <span>{p.name}</span>
                      <span>{formatCurrency(p.value)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-indigo-500 h-2.5 rounded-full"
                        style={{
                          width: `${
                            stats.totalRevenue > 0
                              ? (p.value / stats.totalRevenue) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Sales = ({ userId, sales, inventory }) => {
  const [modalMode, setModalMode] = useState(null); // null, 'add', 'edit'
  const [saleToEdit, setSaleToEdit] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) =>
      sale.item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sales, searchQuery]);

  const summaryStats = useMemo(() => {
    const totalItemsSold = sales.length;
    const netRevenue = sales.reduce(
      (acc, sale) => acc + (sale.salePrice || 0),
      0
    );
    const totalCOG = sales.reduce((acc, sale) => acc + (sale.cogs || 0), 0);
    const totalEbayFees = sales.reduce(
      (acc, sale) => acc + (sale.fees || 0),
      0
    );
    const totalShipping = sales.reduce(
      (acc, sale) => acc + (sale.shipping || 0),
      0
    );
    const totalProfit = netRevenue - totalCOG - totalEbayFees - totalShipping;

    return { totalItemsSold, netRevenue, totalCOG, totalEbayFees, totalProfit };
  }, [sales]);

  const handleEditClick = (sale) => {
    setSaleToEdit(sale);
    setModalMode("edit");
  };

  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
  };

  const handleImportSales = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csv = event.target.result;
          const lines = csv.split("\n").filter((line) => line.trim() !== "");
          if (lines.length < 2)
            throw new Error(
              "CSV must have a header and at least one data row."
            );

          const headers = lines[0].trim().split(",");
          const requiredHeaders = [
            "item",
            "date",
            "platform",
            "salePrice",
            "shipping",
            "fees",
            "cogs",
          ];
          if (JSON.stringify(headers) !== JSON.stringify(requiredHeaders)) {
            throw new Error(
              `Invalid headers. Expected: ${requiredHeaders.join(",")}`
            );
          }

          const batch = writeBatch(db);
          const salesCollection = collection(
            db,
            "artifacts",
            appId,
            "users",
            userId,
            "sales"
          );

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].trim().split(",");
            const saleData = {
              item: values[0],
              date: values[1],
              platform: values[2],
              salePrice: parseFloat(values[3]),
              shipping: parseFloat(values[4]),
              fees: parseFloat(values[5]),
              cogs: parseFloat(values[6]),
            };
            // Basic validation
            if (isNaN(saleData.salePrice) || isNaN(saleData.cogs)) continue;

            const newSaleRef = doc(salesCollection);
            batch.set(newSaleRef, saleData);
          }

          await batch.commit();
          resolve();
        } catch (err) {
          console.error("Error processing CSV:", err);
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;

    try {
      await runTransaction(db, async (transaction) => {
        const saleDocRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          userId,
          "sales",
          saleToDelete.id
        );
        // If sale was linked to inventory, restock it
        if (saleToDelete.inventoryId) {
          const inventoryDocRef = doc(
            db,
            "artifacts",
            appId,
            "users",
            userId,
            "inventory",
            saleToDelete.inventoryId
          );
          const inventoryDoc = await transaction.get(inventoryDocRef);
          if (inventoryDoc.exists()) {
            const currentStock = inventoryDoc.data().stock;
            transaction.update(inventoryDocRef, { stock: currentStock + 1 });
          }
        }
        transaction.delete(saleDocRef);
      });
    } catch (e) {
      console.error("Error deleting sale: ", e);
    }
    setSaleToDelete(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setSaleToEdit(null);
  };

  return (
    <div className="space-y-6">
      <ConfirmDeleteModal
        show={!!saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Sale"
        message={`Are you sure you want to delete the sale for "${saleToDelete?.item}"? This action cannot be undone.`}
      />
      <Modal
        show={modalMode === "add" || modalMode === "edit"}
        onClose={closeModal}
        title={modalMode === "edit" ? "Edit Sale" : "Add New Sale"}
      >
        <AddSaleForm
          userId={userId}
          onAdd={closeModal}
          inventory={inventory}
          saleToEdit={saleToEdit}
          onSave={closeModal}
        />
      </Modal>
      <ImportCSVModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportSales}
        type="sales"
      />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Sold Items</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 text-white p-2 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <UploadIcon className="w-5 h-5" /> Import
          </button>
          <button
            onClick={() =>
              exportToCSV(
                filteredSales.map(({ id, inventoryId, ...rest }) => rest),
                `sales-export-${new Date().toISOString().split("T")[0]}.csv`
              )
            }
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <DownloadIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setModalMode("add")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <PlusCircleIcon className="w-5 h-5" /> Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Items Sold"
          value={summaryStats.totalItemsSold}
          size="small"
        />
        <StatCard
          title="Net Revenue"
          value={formatCurrency(summaryStats.netRevenue)}
          size="small"
        />
        <StatCard
          title="Total COG"
          value={formatCurrency(summaryStats.totalCOG)}
          size="small"
        />
        <StatCard
          title="Total eBay Fees"
          value={formatCurrency(summaryStats.totalEbayFees)}
          size="small"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(summaryStats.totalProfit)}
          size="small"
        />
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="p-3">Item</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">QTY</th>
                <th className="p-3">COG</th>
                <th className="p-3">eBay Fees</th>
                <th className="p-3">Profit</th>
                <th className="p-3">Date Sold</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-6 text-gray-400">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const profit =
                    (sale.salePrice || 0) -
                    (sale.cogs || 0) -
                    (sale.fees || 0) -
                    (sale.shipping || 0);
                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-gray-700 text-gray-300 hover:bg-gray-700/50"
                    >
                      <td className="p-3">{sale.item}</td>
                      <td className="p-3">{formatCurrency(sale.salePrice)}</td>
                      <td className="p-3">1</td>
                      <td className="p-3">{formatCurrency(sale.cogs)}</td>
                      <td className="p-3">{formatCurrency(sale.fees)}</td>
                      <td
                        className={`p-3 font-semibold ${
                          profit > 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {formatCurrency(profit)}
                      </td>
                      <td className="p-3">{sale.date}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(sale)}
                            className="text-gray-400 hover:text-white"
                          >
                            <EditIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(sale)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InventoryManager = ({
  userId,
  inventory,
  sales,
  returns,
  onAddReturn,
}) => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");

  const summaryStats = useMemo(() => {
    const activeListings = inventory.filter((i) => i.stock > 0);
    const totalListings = activeListings.length;
    const totalCOG = activeListings.reduce(
      (acc, item) => acc + (item.cogs || 0) * (item.stock || 0),
      0
    );
    const totalListedValue = activeListings.reduce(
      (acc, item) => acc + (item.listedPrice || 0) * (item.stock || 0),
      0
    );
    return { totalListings, totalCOG, totalListedValue };
  }, [inventory]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 text-white p-2 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Active Listings"
          value={summaryStats.totalListings}
        />
        <StatCard
          title="COG"
          value={formatCurrency(summaryStats.totalCOG)}
          tooltip="Total Cost of Goods"
        />
        <StatCard
          title="Total Listed Value"
          value={formatCurrency(summaryStats.totalListedValue)}
        />
      </div>
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("Overview")}
            className={`${
              activeTab === "Overview"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("Active Listings")}
            className={`${
              activeTab === "Active Listings"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Active Listings
          </button>
          <button
            onClick={() => setActiveTab("Returns")}
            className={`${
              activeTab === "Returns"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Returns
          </button>
        </nav>
      </div>
      <div>
        {activeTab === "Overview" && (
          <InventoryOverview
            userId={userId}
            inventory={inventory}
            sales={sales}
            searchQuery={searchQuery}
          />
        )}
        {activeTab === "Active Listings" && (
          <ActiveListings inventory={inventory} searchQuery={searchQuery} />
        )}
        {activeTab === "Returns" && (
          <ReturnsManager
            userId={userId}
            returns={returns}
            sales={sales}
            onAddReturn={onAddReturn}
          />
        )}
      </div>
    </div>
  );
};

const InventoryOverview = ({ userId, inventory, sales, searchQuery }) => {
  const [modalMode, setModalMode] = useState(null); // null, 'add', 'edit'
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const calculateDaysListed = (listedDate) => {
    if (!listedDate) return "N/A";
    const today = new Date();
    const from = new Date(listedDate);
    const diffTime = Math.abs(today - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleImportInventory = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csv = event.target.result;
          const lines = csv.split("\n").filter((line) => line.trim() !== "");
          if (lines.length < 2)
            throw new Error(
              "CSV must have a header and at least one data row."
            );

          const headers = lines[0].trim().split(",");
          const requiredHeaders = [
            "name",
            "sku",
            "stock",
            "cogs",
            "listedPrice",
            "platform",
          ];
          if (JSON.stringify(headers) !== JSON.stringify(requiredHeaders)) {
            throw new Error(
              `Invalid headers. Expected: ${requiredHeaders.join(",")}`
            );
          }

          const batch = writeBatch(db);
          const inventoryCollection = collection(
            db,
            "artifacts",
            appId,
            "users",
            userId,
            "inventory"
          );

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].trim().split(",");
            const itemData = {
              name: values[0],
              sku: values[1],
              stock: parseInt(values[2], 10),
              cogs: parseFloat(values[3]),
              listedPrice: parseFloat(values[4]),
              platform: values[5],
              listedDate: new Date().toISOString().split("T")[0],
            };
            // Basic validation
            if (
              isNaN(itemData.stock) ||
              isNaN(itemData.cogs) ||
              isNaN(itemData.listedPrice)
            )
              continue;

            const newItemRef = doc(inventoryCollection);
            batch.set(newItemRef, itemData);
          }

          await batch.commit();
          resolve();
        } catch (err) {
          console.error("Error processing inventory CSV:", err);
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const filteredInventory = useMemo(() => {
    const salesByInventoryId = sales.reduce((acc, sale) => {
      if (sale.inventoryId) {
        if (!acc[sale.inventoryId]) acc[sale.inventoryId] = [];
        acc[sale.inventoryId].push(new Date(sale.date));
      }
      return acc;
    }, {});

    return inventory
      .filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.sku &&
            item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map((item) => {
        const lastSaleDate = salesByInventoryId[item.id]
          ? new Date(Math.max.apply(null, salesByInventoryId[item.id]))
          : null;
        const daysListed = calculateDaysListed(item.listedDate);
        const isSlowMoving = item.stock > 0 && daysListed > 90;
        return { ...item, lastSaleDate, isSlowMoving, daysListed };
      });
  }, [inventory, sales, searchQuery]);

  const handleEditClick = (item) => {
    setItemToEdit(item);
    setModalMode("edit");
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteDoc(
      doc(db, "artifacts", appId, "users", userId, "inventory", itemToDelete.id)
    );
    setItemToDelete(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setItemToEdit(null);
  };

  return (
    <div className="space-y-6">
      <ConfirmDeleteModal
        show={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This will not affect past sales records but cannot be undone.`}
      />
      <Modal
        show={modalMode === "add" || modalMode === "edit"}
        onClose={closeModal}
        title={
          modalMode === "edit"
            ? "Edit Inventory Item"
            : "Add New Inventory Item"
        }
      >
        <AddInventoryForm
          userId={userId}
          onAdd={closeModal}
          itemToEdit={itemToEdit}
          onSave={closeModal}
        />
      </Modal>
      <ImportCSVModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportInventory}
        type="inventory"
      />
      <div className="flex justify-end items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <UploadIcon className="w-5 h-5" /> Import
          </button>
          <button
            onClick={() =>
              exportToCSV(
                inventory.map(({ id, ...rest }) => rest),
                `inventory-export-${new Date().toISOString().split("T")[0]}.csv`
              )
            }
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <DownloadIcon className="w-5 h-5" /> Export
          </button>
          <button
            onClick={() => setModalMode("add")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <PlusCircleIcon className="w-5 h-5" /> Add Item
          </button>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="p-3">Product Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Cost (COG)</th>
                <th className="p-3">Listed Price</th>
                <th className="p-3">Days Listed</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-6 text-gray-400">
                    No inventory found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-700 text-gray-300 hover:bg-gray-700/50"
                  >
                    <td className="p-3 flex items-center gap-3">
                      {item.name}{" "}
                      {item.isSlowMoving && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-300 rounded-full">
                          Slow Moving
                        </span>
                      )}
                    </td>
                    <td className="p-3">{item.sku}</td>
                    <td
                      className={`p-3 font-bold ${
                        item.stock <= 0 ? "text-red-400" : "text-white"
                      }`}
                    >
                      {item.stock}
                    </td>
                    <td className="p-3">{formatCurrency(item.cogs)}</td>
                    <td className="p-3">{formatCurrency(item.listedPrice)}</td>
                    <td className="p-3">{item.daysListed}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="text-gray-400 hover:text-white"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ActiveListings = ({ inventory, searchQuery }) => {
  const activeItems = useMemo(() => {
    const calculateDaysListed = (listedDate) => {
      if (!listedDate) return 0;
      const today = new Date();
      const from = new Date(listedDate);
      const diffTime = Math.abs(today - from);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    return inventory
      .filter(
        (i) =>
          i.stock > 0 &&
          (i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.sku && i.sku.toLowerCase().includes(searchQuery.toLowerCase())))
      )
      .map((i) => ({ ...i, daysListed: calculateDaysListed(i.listedDate) }));
  }, [inventory, searchQuery]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="p-3">Product Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Available Stock</th>
              <th className="p-3">Listed Price</th>
              <th className="p-3">Days Listed</th>
            </tr>
          </thead>
          <tbody>
            {activeItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-400">
                  No active listings found.
                </td>
              </tr>
            ) : (
              activeItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-700 text-gray-300 hover:bg-gray-700/50"
                >
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.sku}</td>
                  <td className="p-3 font-bold">{item.stock}</td>
                  <td className="p-3">{formatCurrency(item.listedPrice)}</td>
                  <td className="p-3">{item.daysListed}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReturnsManager = ({ userId, returns, sales, onAddReturn }) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          <PlusCircleIcon className="w-5 h-5" /> Log Return
        </button>
      </div>
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Log a New Return"
      >
        <AddReturnForm
          userId={userId}
          sales={sales}
          onAdd={() => {
            onAddReturn();
            setShowModal(false);
          }}
        />
      </Modal>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="p-3">Returned Item</th>
                <th className="p-3">Return Date</th>
                <th className="p-3">Original Sale Date</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {returns.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-400">
                    No returns have been logged.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => {
                  const originalSale = sales.find((s) => s.id === ret.saleId);
                  return (
                    <tr
                      key={ret.id}
                      className="border-b border-gray-700 text-gray-300 hover:bg-gray-700/50"
                    >
                      <td className="p-3">{originalSale?.item || "N/A"}</td>
                      <td className="p-3">{ret.date}</td>
                      <td className="p-3">{originalSale?.date || "N/A"}</td>
                      <td className="p-3">{ret.reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AddReturnForm = ({ userId, sales, onAdd }) => {
  const [saleId, setSaleId] = useState("");
  const [reason, setReason] = useState("Customer changed mind");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!saleId) {
      setError("Please select a sold item to return.");
      return;
    }

    const saleToReturn = sales.find((s) => s.id === saleId);
    if (!saleToReturn || !saleToReturn.inventoryId) {
      setError(
        "This item cannot be returned automatically as it was not linked to inventory. Please adjust stock manually."
      );
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const inventoryDocRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          userId,
          "inventory",
          saleToReturn.inventoryId
        );
        const inventoryDoc = await transaction.get(inventoryDocRef);
        if (!inventoryDoc.exists()) throw "Original inventory item not found!";

        const currentStock = inventoryDoc.data().stock;
        transaction.update(inventoryDocRef, { stock: currentStock + 1 });

        const returnData = {
          saleId,
          reason,
          date: new Date().toISOString().split("T")[0],
        };
        const newReturnRef = doc(
          collection(db, "artifacts", appId, "users", userId, "returns")
        );
        transaction.set(newReturnRef, returnData);
      });
      onAdd();
    } catch (err) {
      console.error("Return transaction failed:", err);
      setError(err.toString());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>
      )}
      <select
        value={saleId}
        onChange={(e) => setSaleId(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
        required
      >
        <option value="">Select a sold item...</option>
        {sales
          .filter((s) => s.inventoryId)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.item} (Sold on {s.date})
            </option>
          ))}
      </select>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg"
      >
        <option>Customer changed mind</option>
        <option>Item defective</option>
        <option>Wrong item sent</option>
        <option>Other</option>
      </select>
      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg"
      >
        Log Return
      </button>
    </form>
  );
};

const Expenses = ({ userId, expenses }) => {
  const [modalMode, setModalMode] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "all") return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const handleEditClick = (expense) => {
    setExpenseToEdit(expense);
    setModalMode("edit");
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    await deleteDoc(
      doc(
        db,
        "artifacts",
        appId,
        "users",
        userId,
        "expenses",
        expenseToDelete.id
      )
    );
    setExpenseToDelete(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setExpenseToEdit(null);
  };

  return (
    <div className="space-y-6">
      <ConfirmDeleteModal
        show={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete the expense "${expenseToDelete?.name}"? This action cannot be undone.`}
      />
      <Modal
        show={modalMode === "add" || modalMode === "edit"}
        onClose={closeModal}
        title={modalMode === "edit" ? "Edit Expense" : "Add New Expense"}
      >
        <AddExpenseForm
          userId={userId}
          onAdd={closeModal}
          expenseToEdit={expenseToEdit}
          onSave={closeModal}
        />
      </Modal>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Expenses</h1>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded-lg"
          >
            <option value="all">All Categories</option>
            <option>Supplies</option>
            <option>Software</option>
            <option>Advertising</option>
            <option>Other</option>
          </select>
          <button
            onClick={() =>
              exportToCSV(
                filteredExpenses.map(({ id, ...rest }) => rest),
                `expenses-export-${new Date().toISOString().split("T")[0]}.csv`
              )
            }
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <DownloadIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setModalMode("add")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            <PlusCircleIcon className="w-5 h-5" /> Add
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="p-3">Expense</th>
                <th className="p-3">Category</th>
                <th className="p-3">Date</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-400">
                    No expenses recorded for this filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-gray-700 text-gray-300 hover:bg-gray-700/50"
                  >
                    <td className="p-3">{expense.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 text-xs font-semibold bg-purple-500/20 text-purple-300 rounded-full">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-3">{expense.date}</td>
                    <td
                      className="p-3 text-sm text-gray-400 max-w-xs truncate"
                      title={expense.notes}
                    >
                      {expense.notes}
                    </td>
                    <td className="p-3">{formatCurrency(expense.amount)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="text-gray-400 hover:text-white"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(expense)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AIHub = ({ sales }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState("");

  const fetchAIInsights = async () => {
    if (sales.length === 0) {
      setError("Please add at least one sale to generate insights.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setInsights("");
    const salesSummary = sales
      .map(
        (s) =>
          `Sold '${s.item}' on ${s.platform} for ${formatCurrency(
            s.salePrice
          )} with a cost of ${formatCurrency(s.cogs)}.`
      )
      .join("\n");
    const systemPrompt =
      "You are an expert e-commerce analyst... Format your response using markdown...";
    const userQuery = `Based on the following recent sales data, provide a "Sourcing & Growth Report"... Here is the sales data: ${salesSummary}`;
    try {
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      };
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) setInsights(text);
      else throw new Error("No content received from API.");
    } catch (err) {
      setError(err.message);
      console.error("Error fetching AI insights:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">
        AI Sourcing & Growth Hub
      </h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <SparklesIcon className="w-16 h-16 mx-auto text-yellow-400" />
        <h2 className="text-2xl font-semibold text-white mt-4">
          Unlock Your Next Bestseller
        </h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          Use AI to analyze your sales data and discover profitable new sourcing
          opportunities.
        </p>
        <button
          onClick={fetchAIInsights}
          disabled={isLoading}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing...
            </>
          ) : (
            "Generate AI Growth Report"
          )}
        </button>
      </div>
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg">{`${error}`}</div>
      )}
      {insights && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-4">
            Your Custom Report
          </h3>
          <div
            className="prose prose-invert max-w-none text-gray-300"
            dangerouslySetInnerHTML={{
              __html: insights.replace(/\n/g, "<br />"),
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

const Reports = ({ sales, expenses, returns }) => {
  const [days, setDays] = useState(30);

  const filteredData = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    if (days !== 0) {
      startDate.setDate(endDate.getDate() - days);
    }

    const filteredSales =
      days === 0 ? sales : sales.filter((s) => new Date(s.date) >= startDate);
    const filteredExpenses =
      days === 0
        ? expenses
        : expenses.filter((e) => new Date(e.date) >= startDate);
    const filteredReturns =
      days === 0
        ? returns
        : returns.filter((r) => new Date(r.date) >= startDate);

    return {
      sales: filteredSales,
      expenses: filteredExpenses,
      returns: filteredReturns,
    };
  }, [sales, expenses, returns, days]);

  const reportStats = useMemo(() => {
    const totalRevenue = filteredData.sales.reduce(
      (acc, sale) => acc + (sale.salePrice || 0),
      0
    );

    const returnsImpact = filteredData.returns.reduce((acc, ret) => {
      const originalSale = sales.find((s) => s.id === ret.saleId);
      if (!originalSale) return acc;
      return (
        acc +
        ((originalSale.salePrice || 0) -
          (originalSale.cogs || 0) -
          (originalSale.fees || 0) -
          (originalSale.shipping || 0))
      );
    }, 0);

    const netProfit =
      filteredData.sales.reduce(
        (acc, sale) =>
          acc +
          ((sale.salePrice || 0) -
            (sale.cogs || 0) -
            (sale.fees || 0) -
            (sale.shipping || 0)),
        0
      ) -
      filteredData.expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0) -
      returnsImpact;

    const topSellers = filteredData.sales.reduce((acc, sale) => {
      acc[sale.item] = (acc[sale.item] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRevenue,
      netProfit,
      totalSales: filteredData.sales.length,
      topSellers: Object.entries(topSellers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [filteredData, sales]);

  const monthlyProfitData = useMemo(() => {
    const months = {};
    [...filteredData.sales, ...filteredData.expenses].forEach((item) => {
      const month = new Date(item.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!months[month]) months[month] = { profit: 0 };
      if (item.salePrice !== undefined) {
        months[month].profit +=
          (item.salePrice || 0) -
          (item.cogs || 0) -
          (item.fees || 0) -
          (item.shipping || 0);
      } else {
        months[month].profit -= item.amount || 0;
      }
    });

    filteredData.returns.forEach((ret) => {
      const month = new Date(ret.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      const originalSale = sales.find((s) => s.id === ret.saleId);
      if (originalSale && months[month]) {
        months[month].profit -=
          (originalSale.salePrice || 0) -
          (originalSale.cogs || 0) -
          (originalSale.fees || 0) -
          (originalSale.shipping || 0);
      }
    });

    return Object.entries(months)
      .map(([label, data]) => ({ label, value: data.profit }))
      .reverse();
  }, [filteredData, sales]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
          {[
            { label: "30 Days", val: 30 },
            { label: "90 Days", val: 90 },
            { label: "All Time", val: 0 },
          ].map((period) => (
            <button
              key={period.val}
              onClick={() => setDays(period.val)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition ${
                days === period.val
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(reportStats.totalRevenue)}
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(reportStats.netProfit)}
        />
        <StatCard title="Total Sales" value={reportStats.totalSales} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Monthly Profit
          </h2>
          <BarChart data={monthlyProfitData} />
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Top Selling Products
          </h2>
          {reportStats.topSellers.length > 0 ? (
            <ul className="space-y-3">
              {reportStats.topSellers.map(([name, count]) => (
                <li
                  key={name}
                  className="flex justify-between items-center text-gray-300"
                >
                  <span>{name}</span>
                  <span className="font-bold">{count} sales</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">
              Not enough sales data to show top sellers.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ data }) => {
  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 0),
    [data]
  );
  const minValue = useMemo(
    () => Math.min(...data.map((d) => d.value), 0),
    [data]
  );

  if (!data || data.length === 0)
    return <p className="text-gray-400">No data to display for this period.</p>;

  return (
    <div className="flex justify-around items-end h-64 bg-gray-900/50 p-4 rounded-lg space-x-2">
      {data.map(({ label, value }) => {
        const heightPercentage =
          maxValue === minValue
            ? 50
            : ((value - minValue) / (maxValue - minValue)) * 100;
        return (
          <div
            key={label}
            className="flex-1 flex flex-col items-center justify-end"
          >
            <div className="text-xs text-gray-400">{formatCurrency(value)}</div>
            <div
              className={`w-3/4 rounded-t-lg transition-all duration-500 ${
                value >= 0 ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ height: `${heightPercentage}%` }}
              title={`${label}: ${formatCurrency(value)}`}
            ></div>
            <div className="text-sm font-semibold mt-2 text-gray-300">
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Settings = ({ userId, settings, onUpdate }) => {
  const IntegrationCard = ({ platformName }) => (
    <div className="bg-gray-700 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold text-white text-lg`}>{platformName}</h3>
          <p className="text-sm text-gray-400">
            Sync your sales and fees automatically.
          </p>
        </div>
        <button
          disabled
          className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed"
        >
          Coming Soon
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-3">
          Marketplace Integrations
        </h2>
        <div className="space-y-4 mt-6">
          <IntegrationCard platformName="eBay" />
          <IntegrationCard platformName="Shopify" />
        </div>
      </div>
    </div>
  );
};

const EditGoalsForm = ({ currentGoals, onSave, onCancel }) => {
  const [monthlyProfit, setMonthlyProfit] = useState(
    currentGoals.monthlyProfit || ""
  );
  const [annualRevenue, setAnnualRevenue] = useState(
    currentGoals.annualRevenue || ""
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      monthlyProfit: parseFloat(monthlyProfit) || 0,
      annualRevenue: parseFloat(annualRevenue) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="monthly-profit"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Monthly Profit Goal
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-400">$</span>
          </div>
          <input
            type="number"
            id="monthly-profit"
            value={monthlyProfit}
            onChange={(e) => setMonthlyProfit(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg pl-7"
            placeholder="e.g., 5000"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="annual-revenue"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Annual Revenue Goal
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-400">$</span>
          </div>
          <input
            type="number"
            id="annual-revenue"
            value={annualRevenue}
            onChange={(e) => setAnnualRevenue(e.target.value)}
            className="w-full bg-gray-700 text-white p-3 rounded-lg pl-7"
            placeholder="e.g., 60000"
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Save Goals
        </button>
      </div>
    </form>
  );
};

const Goals = ({ sales, expenses, goals, onUpdate, returns }) => {
  const [showModal, setShowModal] = useState(false);

  const progressData = useMemo(() => {
    const annualRevenue = sales.reduce((acc, s) => acc + (s.salePrice || 0), 0);

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const currentMonthSales = sales.filter(
      (s) => new Date(s.date) >= startOfMonth
    );
    const currentMonthExpenses = expenses.filter(
      (e) => new Date(e.date) >= startOfMonth
    );
    const currentMonthReturns = returns.filter(
      (r) => new Date(r.date) >= startOfMonth
    );
    const profit =
      currentMonthSales.reduce(
        (acc, sale) =>
          acc +
          ((sale.salePrice || 0) -
            (sale.cogs || 0) -
            (sale.fees || 0) -
            (sale.shipping || 0)),
        0
      ) - currentMonthExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    const returnsImpact = currentMonthReturns.reduce((acc, ret) => {
      const originalSale = sales.find((s) => s.id === ret.saleId);
      if (!originalSale) return acc;
      return (
        acc +
        ((originalSale.salePrice || 0) -
          (originalSale.cogs || 0) -
          (originalSale.fees || 0) -
          (originalSale.shipping || 0))
      );
    }, 0);
    const monthlyProfit = profit - returnsImpact;

    return { annualRevenue, monthlyProfit };
  }, [sales, expenses, returns]);

  const handleSaveGoals = (newGoals) => {
    onUpdate(newGoals);
    setShowModal(false);
  };

  const GoalProgressCard = ({ title, current, target }) => {
    const progress = target > 0 ? (current / target) * 100 : 0;
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
        {target > 0 ? (
          <div>
            <div className="flex justify-between items-center text-gray-300 mb-1">
              <span>{formatCurrency(current)}</span>
              <span className="font-semibold">{formatCurrency(target)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <p className="text-right text-sm text-gray-400 mt-1">
              {progress.toFixed(1)}% of your goal achieved
            </p>
          </div>
        ) : (
          <p className="text-gray-400">No goal has been set for this period.</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Business Goals</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Set/Edit Goals
        </button>
      </div>
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Set Business Goals"
      >
        <EditGoalsForm
          currentGoals={goals}
          onSave={handleSaveGoals}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalProgressCard
          title="Monthly Profit Goal"
          current={progressData.monthlyProfit}
          target={goals.monthlyProfit}
        />
        <GoalProgressCard
          title="Annual Revenue Goal"
          current={progressData.annualRevenue}
          target={goals.annualRevenue}
        />
      </div>
    </div>
  );
};

const Support = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Support Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Contact Us</h2>
          <p className="text-gray-400">
            Have a question or need help? Our team is here for you.
          </p>
          <a
            href="https://www.fbacenter.com.au/contact-us/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Email Support
          </a>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Knowledge Base
          </h2>
          <p className="text-gray-400">
            Find answers to common questions and learn how to use ProfitTrack.
          </p>
          <button
            className="mt-4 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed"
            disabled
          >
            Browse Articles (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

const EbayFeeCalculator = () => {
  const [inputs, setInputs] = useState({
    soldPrice: "",
    itemCost: "",
    shippingCharged: "",
    shippingCost: "",
    storeLevel: "none",
    promotedRate: "",
    isInternational: false,
  });
  const [results, setResults] = useState(null);

  const STORE_FEE_RATES = { none: 0.1325, basic: 0.1235, premium: 0.1235 };
  const FIXED_FEE = 0.3;
  const INTERNATIONAL_FEE_RATE = 0.0165;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  useEffect(() => {
    const soldPrice = parseFloat(inputs.soldPrice) || 0;
    const itemCost = parseFloat(inputs.itemCost) || 0;
    const shippingCharged = parseFloat(inputs.shippingCharged) || 0;
    const shippingCost = parseFloat(inputs.shippingCost) || 0;
    const promotedRate = (parseFloat(inputs.promotedRate) || 0) / 100;

    if (soldPrice > 0) {
      const totalSale = soldPrice + shippingCharged;
      const baseFeeRate = STORE_FEE_RATES[inputs.storeLevel];
      const finalValueFee = totalSale * baseFeeRate;
      const promotedFee = totalSale * promotedRate;
      const internationalFee = inputs.isInternational
        ? totalSale * INTERNATIONAL_FEE_RATE
        : 0;
      const totalEbayFees =
        finalValueFee + promotedFee + internationalFee + FIXED_FEE;
      const netProfit = totalSale - itemCost - shippingCost - totalEbayFees;

      setResults({
        finalValueFee,
        promotedFee,
        totalEbayFees,
        netProfit,
        breakdown: [
          { label: "Profit", value: netProfit > 0 ? netProfit : 0 },
          { label: "eBay Fees", value: totalEbayFees },
          { label: "Shipping Cost", value: shippingCost },
          { label: "Item Cost", value: itemCost },
        ],
      });
    } else {
      setResults(null);
    }
  }, [inputs]);

  const InputField = ({ label, name, value, icon, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-gray-500">{icon || "$"}</span>
        </div>
        <input
          name={name}
          value={value}
          onChange={handleInputChange}
          className="w-full bg-gray-700 text-white p-2 pl-8 rounded-lg"
          {...props}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">eBay Fee Calculator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4">
              Sale & Item Costs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Sold Price"
                name="soldPrice"
                value={inputs.soldPrice}
                type="number"
                placeholder="50.00"
              />
              <InputField
                label="Item Cost"
                name="itemCost"
                value={inputs.itemCost}
                type="number"
                placeholder="10.00"
              />
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Shipping</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Shipping Charged"
                name="shippingCharged"
                value={inputs.shippingCharged}
                type="number"
                placeholder="5.00"
              />
              <InputField
                label="Actual Shipping Cost"
                name="shippingCost"
                value={inputs.shippingCost}
                type="number"
                placeholder="4.50"
              />
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4">
              eBay Fees & Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Store Level
                </label>
                <select
                  name="storeLevel"
                  value={inputs.storeLevel}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 text-white p-2 rounded-lg"
                >
                  <option value="none">No Store (13.25%)</option>
                  <option value="basic">Basic Store (12.35%)</option>
                  <option value="premium">Premium Store (12.35%)</option>
                </select>
              </div>
              <InputField
                label="Promoted Rate"
                name="promotedRate"
                value={inputs.promotedRate}
                type="number"
                placeholder="2.5"
                icon="%"
              />
            </div>
            <div className="flex items-center mt-4">
              <input
                id="isInternational"
                name="isInternational"
                type="checkbox"
                checked={inputs.isInternational}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="isInternational"
                className="ml-2 block text-sm text-gray-300"
              >
                International Sale (+1.65%)
              </label>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Profit Breakdown
          </h2>
          {results ? (
            <div className="flex flex-col items-center justify-center flex-grow">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm">Net Profit</p>
                <p
                  className={`text-5xl font-bold ${
                    results.netProfit >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(results.netProfit)}
                </p>
              </div>
              <DonutChart data={results.breakdown} showLabels={false} />
              <div className="w-full mt-6 space-y-2 text-sm">
                {results.breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-400">{item.label}</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Enter sale details to calculate profit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [activeView, setActiveView] = useState("Dashboard");
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState({ ebay: false, shopify: false });
  const [goals, setGoals] = useState({ monthlyProfit: 0, annualRevenue: 0 });
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    const authSignIn = async (auth) => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication error:", error);
      }
    };
    authSignIn(auth);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const collections = ["sales", "inventory", "expenses", "returns"];
    const setters = {
      sales: setSales,
      inventory: setInventory,
      expenses: setExpenses,
      returns: setReturns,
    };

    const unsubscribers = collections.map((col) => {
      const q = collection(db, "artifacts", appId, "users", userId, col);
      return onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (col === "sales" || col === "returns")
          items.sort((a, b) => new Date(b.date) - new Date(a.date));
        setters[col](items);
      });
    });

    // Listener for settings
    const settingsDocRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      userId,
      "settings",
      "integrations"
    );
    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        setSettings({ ebay: false, shopify: false });
      }
    });
    unsubscribers.push(unsubSettings);

    // Listener for goals
    const goalsDocRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      userId,
      "settings",
      "goals"
    );
    const unsubGoals = onSnapshot(goalsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setGoals(docSnap.data());
      } else {
        setGoals({ monthlyProfit: 0, annualRevenue: 0 });
      }
    });
    unsubscribers.push(unsubGoals);

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [userId]);

  const handleSettingsUpdate = async (newSettings) => {
    if (!userId) return;
    const settingsDocRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      userId,
      "settings",
      "integrations"
    );
    await setDoc(settingsDocRef, newSettings, { merge: true });
  };

  const handleGoalsUpdate = async (newGoals) => {
    if (!userId) return;
    const goalsDocRef = doc(
      db,
      "artifacts",
      appId,
      "users",
      userId,
      "settings",
      "goals"
    );
    await setDoc(goalsDocRef, newGoals, { merge: true });
  };

  const handleAddReturn = () => {
    // This function is passed down to force a re-render of components that depend on returns data
    // The onSnapshot listener will handle the actual data update
  };

  const renderView = () => {
    if (isLoading || !userId) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-white text-xl">Loading Your Data...</div>
        </div>
      );
    }
    switch (activeView) {
      case "Dashboard":
        return (
          <Dashboard
            sales={sales}
            expenses={expenses}
            goals={goals}
            returns={returns}
          />
        );
      case "Sales":
        return <Sales userId={userId} sales={sales} inventory={inventory} />;
      case "Inventory":
        return (
          <InventoryManager
            userId={userId}
            inventory={inventory}
            sales={sales}
            returns={returns}
            onAddReturn={handleAddReturn}
          />
        );
      case "Expenses":
        return <Expenses userId={userId} expenses={expenses} />;
      case "Reports":
        return <Reports sales={sales} expenses={expenses} returns={returns} />;
      case "Goals":
        return (
          <Goals
            sales={sales}
            expenses={expenses}
            goals={goals}
            onUpdate={handleGoalsUpdate}
            returns={returns}
          />
        );
      case "AI Hub":
        return <AIHub sales={sales} />;
      case "eBay Calculator":
        return <EbayFeeCalculator />;
      case "Settings":
        return (
          <Settings
            userId={userId}
            settings={settings}
            onUpdate={handleSettingsUpdate}
          />
        );
      case "Support":
        return <Support />;
      default:
        return (
          <Dashboard
            sales={sales}
            expenses={expenses}
            goals={goals}
            returns={returns}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex font-sans">
      <nav className="w-64 bg-gray-800 p-4 flex flex-col flex-shrink-0">
        <div className="flex items-center space-x-2 mb-8 px-2">
          <PackageIcon className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">ProfitTrack</h1>
        </div>
        <div className="flex-grow">
          <NavGroup title="FINANCES">
            <NavItem
              icon={<HomeIcon />}
              label="Dashboard"
              activeView={activeView}
              setActiveView={setActiveView}
            />
            <NavItem
              icon={<TrendingUpIcon />}
              label="Sales"
              activeView={activeView}
              setActiveView={setActiveView}
            />
            <NavItem
              icon={<CreditCardIcon />}
              label="Expenses"
              activeView={activeView}
              setActiveView={setActiveView}
            />
            <NavItem
              icon={<BarChart2Icon />}
              label="Reports"
              activeView={activeView}
              setActiveView={setActiveView}
            />
          </NavGroup>
          <NavGroup title="MANAGEMENT">
            <NavItem
              icon={<PackageIcon />}
              label="Inventory"
              activeView={activeView}
              setActiveView={setActiveView}
            />
          </NavGroup>
          <NavGroup title="BUSINESS">
            <NavItem
              icon={<TrophyIcon />}
              label="Goals"
              activeView={activeView}
              setActiveView={setActiveView}
            />
            <NavItem
              icon={<SparklesIcon />}
              label="AI Hub"
              activeView={activeView}
              setActiveView={setActiveView}
            />
            <NavItem
              icon={<CalculatorIcon />}
              label="eBay Calculator"
              activeView={activeView}
              setActiveView={setActiveView}
            />
            <NavItem
              icon={<SettingsIcon />}
              label="Settings"
              activeView={activeView}
              setActiveView={setActiveView}
            />
          </NavGroup>
        </div>
        <div className="flex-shrink-0">
          <NavItem
            icon={<LifeBuoyIcon />}
            label="Support"
            activeView={activeView}
            setActiveView={setActiveView}
          />
        </div>
      </nav>
      <main className="flex-1 p-8 overflow-y-auto">{renderView()}</main>
    </div>
  );
}

const NavGroup = ({ title, children }) => (
  <div className="mb-4">
    <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {title}
    </h2>
    <ul>{children}</ul>
  </div>
);

const NavItem = ({ icon, label, activeView, setActiveView }) => {
  const isActive = activeView === label;
  return (
    <li className="mb-1">
      <button
        onClick={() => setActiveView(label)}
        className={`w-full flex items-center space-x-3 p-2.5 rounded-lg text-left transition-all duration-200 ${
          isActive
            ? "bg-indigo-600 text-white shadow-lg"
            : "text-gray-400 hover:bg-gray-700 hover:text-white"
        }`}
      >
        {React.cloneElement(icon, { className: "w-6 h-6" })}
        <span className="font-semibold">{label}</span>
      </button>
    </li>
  );
};
