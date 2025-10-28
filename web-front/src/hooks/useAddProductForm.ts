import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getCategories } from '@/service/api/category';

interface Category {
  category_id: number;
  category_name: string;
}

interface Variant {
  sku: string;
  price: number;
  stock_quantity: number;
  option_values: string[];
}

interface Batch {
  batch_number: string;
  manufactured_date: string;
  expiry_date: string;
  quantity: string;
}

export function useAddProductForm() {
  // Basic product info
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  // Variants and options
  const [useVariants, setUseVariants] = useState(false);
  const [options, setOptions] = useState<{ name: string; values: string[] }[]>([
    { name: '', values: [''] }
  ]);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  // Batches
  const [batches, setBatches] = useState<Batch[][]>([]);
  const [simpleBatches, setSimpleBatches] = useState<Batch[]>([
    { batch_number: '', manufactured_date: '', expiry_date: '', quantity: '' }
  ]);
  
  // Form state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('โหลดประเภทสินค้าไม่สำเร็จ', err);
        toast.error('โหลดหมวดหมู่ไม่สำเร็จ');
      }
    }
    fetchCategories();
  }, []);

  // Option handlers
  const handleOptionNameChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].name = value;
    setOptions(newOptions);
  };

  const handleOptionValueChange = (optionIndex: number, valueIndex: number, value: string) => {
    const newOptions = [...options];
    newOptions[optionIndex].values[valueIndex] = value;
    setOptions(newOptions);
  };

  const addOption = () => setOptions([...options, { name: '', values: [''] }]);

  const addOptionValue = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.push('');
    setOptions(newOptions);
  };

  // Generate variants based on options
  const generateVariants = () => {
    const cartesian = (arrays: string[][]): string[][] =>
      arrays.reduce<string[][]>((acc, curr) => 
        acc.flatMap((a) => curr.map((c) => [...a, c])), [[]]);

    // Filter out empty values
    const filteredValues = options.map((opt) => 
      opt.values.filter((v) => v.trim() !== '')
    );
    
    // Check if any option has no values
    if (filteredValues.some((vals) => vals.length === 0)) {
      toast.error('❌ กรุณากรอกค่าตัวเลือกให้ครบทุก option (เช่น กรอก "แดง", "น้ำเงิน")');
      return;
    }

    const combos = cartesian(filteredValues);
    
    const newVariants = combos.map((combo) => ({ 
      sku: '', 
      price: 0, 
      stock_quantity: 0, 
      option_values: combo 
    }));
    
    setVariants(newVariants);
    setBatches(combos.map(() => [{ 
      batch_number: '', 
      manufactured_date: '', 
      expiry_date: '', 
      quantity: '' 
    }]));
    
    toast.success(`✅ สร้าง ${newVariants.length} ตัวเลือกสำเร็จ!`);
  };

  // Variant handlers
  const handleVariantChange = (index: number, field: 'sku' | 'price' | 'stock_quantity', value: string) => {
    const newVariants = [...variants];
    if (field === 'sku') {
      newVariants[index].sku = value;
    } else {
      const numValue = parseFloat(value) || 0;
      newVariants[index][field] = numValue;
    }
    setVariants(newVariants);
  };

  // Reset form
  const resetForm = () => {
    setProductName('');
    setProductDescription('');
    setPrice('');
    setCategoryId('');
    setImageFiles([]);
    setUseVariants(false);
    setOptions([{ name: '', values: [''] }]);
    setVariants([]);
    setBatches([]);
    setSimpleBatches([{ batch_number: '', manufactured_date: '', expiry_date: '', quantity: '' }]);
    setStep(1);
  };

  // Validation
  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!productName.trim()) {
          toast.error('❌ กรุณากรอกชื่อสินค้า');
          return false;
        }
        if (!productDescription.trim()) {
          toast.error('❌ กรุณากรอกรายละเอียดสินค้า');
          return false;
        }
        if (!categoryId) {
          toast.error('❌ กรุณาเลือกหมวดหมู่');
          return false;
        }
        if (!useVariants && (!price || price <= 0)) {
          toast.error('❌ กรุณากรอกราคาที่ถูกต้อง');
          return false;
        }
        return true;
      
      case 2:
        if (useVariants) {
          const hasValidOptions = options.some(opt => 
            opt.name.trim() && opt.values.some(val => val.trim())
          );
          if (!hasValidOptions) {
            toast.error('❌ กรุณาตั้งค่าตัวเลือกสินค้า');
            return false;
          }
          if (variants.length === 0) {
            toast.error('❌ กรุณาสร้างตัวเลือกสินค้าก่อน');
            return false;
          }
        }
        return true;
      
      case 3:
        if (imageFiles.length === 0) {
          toast.error('❌ กรุณาเลือกรูปภาพสินค้าอย่างน้อย 1 รูป');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  return {
    // State
    productName,
    productDescription,
    price,
    categoryId,
    categories,
    imageFiles,
    useVariants,
    options,
    variants,
    batches,
    simpleBatches,
    step,
    loading,
    
    // Setters
    setProductName,
    setProductDescription,
    setPrice,
    setCategoryId,
    setImageFiles,
    setUseVariants,
    setStep,
    setLoading,
    
    // Handlers
    handleOptionNameChange,
    handleOptionValueChange,
    addOption,
    addOptionValue,
    generateVariants,
    handleVariantChange,
    resetForm,
    validateStep,
  };
}