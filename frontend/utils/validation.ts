export const validateMenuItem = (item: any): string[] => {
  const errors: string[] = [];

  if (!item.name?.trim()) {
    errors.push('Item name is required');
  }

  if (!item.description?.trim()) {
    errors.push('Description is required');
  }

  if (!item.price || parseFloat(item.price) <= 0) {
    errors.push('Valid price is required');
  }

  if (!item.category) {
    errors.push('Category is required');
  }

  // Validate customizations
  if (item.customizations) {
    item.customizations.forEach((custom: any, index: number) => {
      if (!custom.name?.trim()) {
        errors.push(`Customization ${index + 1} name is required`);
      }
      
      if (!custom.options || custom.options.length === 0) {
        errors.push(`Customization ${index + 1} must have at least one option`);
      }

      custom.options?.forEach((option: any, optIndex: number) => {
        if (!option.name?.trim()) {
          errors.push(`Customization ${index + 1}, option ${optIndex + 1} name is required`);
        }
        
        if (option.price < 0) {
          errors.push(`Customization ${index + 1}, option ${optIndex + 1} price cannot be negative`);
        }
      });
    });
  }

  return errors;
};

export const formatMenuItemForApi = (formData: any) => {
  return {
    name: formData.name.trim(),
    description: formData.description.trim(),
    price: parseFloat(formData.price),
    category: formData.category,
    allergens: formData.allergens?.split(',').map((a: string) => a.trim()).filter(Boolean) || [],
    allergenNotes: formData.allergenNotes?.trim() || '',
    dietaryInfo: formData.dietaryInfo || [],
    available: formData.available !== false,
    customizations: formData.customizations || [],
    restaurantId: formData.restaurantId
  };
};