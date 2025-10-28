'use client';

import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { addproduct } from '@/service/apis';
import { useAddProductForm } from '@/hooks/useAddProductForm';
import ProductBasicInfo from '@/components/product/ProductBasicInfo';
import ProductOptions from '@/components/product/ProductOptions';
import ProductVariants from '@/components/product/ProductVariants';
import ProductImages from '@/components/product/ProductImages';

interface AddProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
  const {
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
  } = useAddProductForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      
      await addproduct(
        token,
        productName,
        productDescription,
        useVariants ? 0 : Number(price),
        Number(categoryId),
        imageFiles,
        options,
        variants,
        [] // batches - simplified for now
      );

      toast.success('✅ เพิ่มสินค้าสำเร็จ!');
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('❌ เพิ่มสินค้าไม่สำเร็จ:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดขณะเพิ่มสินค้า';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const totalSteps = useVariants ? 4 : 3;
  const canSubmit = step === totalSteps;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-xl shadow-lg p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center text-blue-700">เพิ่มสินค้าใหม่ 🛍️</h2>
        <div className="flex items-center justify-center mt-4">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].slice(0, totalSteps).map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum <= step
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < totalSteps && (
                  <div
                    className={`h-1 w-8 ${
                      stepNum < step ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <ProductBasicInfo
            productName={productName}
            productDescription={productDescription}
            price={price}
            categoryId={categoryId}
            categories={categories}
            useVariants={useVariants}
            onProductNameChange={setProductName}
            onProductDescriptionChange={setProductDescription}
            onPriceChange={(value) => setPrice(value === '' ? '' : Number(value))}
            onCategoryIdChange={(value) => setCategoryId(value === '' ? '' : Number(value))}
            onUseVariantsChange={setUseVariants}
          />
        )}

        {/* Step 2: Options (only if using variants) */}
        {step === 2 && useVariants && (
          <>
            <ProductOptions
              options={options}
              onOptionNameChange={handleOptionNameChange}
              onOptionValueChange={handleOptionValueChange}
              onAddOption={addOption}
              onAddOptionValue={addOptionValue}
              onGenerateVariants={generateVariants}
            />
            <ProductVariants
              variants={variants}
              onVariantChange={handleVariantChange}
            />
          </>
        )}

        {/* Step 2/3: Images */}
        {((step === 2 && !useVariants) || (step === 3 && useVariants)) && (
          <ProductImages
            imageFiles={imageFiles}
            onImageFilesChange={setImageFiles}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            ยกเลิก
          </button>
          
          <div className="flex space-x-3">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ← ก่อนหน้า
              </button>
            )}
            
            {canSubmit ? (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {loading ? 'กำลังเพิ่ม...' : '✅ เพิ่มสินค้า'}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                ถัดไป →
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}