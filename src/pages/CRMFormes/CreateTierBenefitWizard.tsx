import { useState } from "react";
import { 
  TierBenefitsService, 
  BenefitType, 
  TierBenefitCreateRequestDto,
  TierBenefitResponseDto 
} from "../../services/CrmTierBenefits.service";
import { MembershipTier } from "../../services/Crm.service";

interface CreateTierBenefitWizardProps {
  onSuccess?: (benefit: TierBenefitResponseDto) => void;
  onCancel?: () => void;
}

interface FormData {
  tier: MembershipTier | '';
  benefitType: BenefitType | '';
  benefitConfig: string;
  discountPercentage: number | '';
  maxDiscountAmount: number | '';
  minOrderAmount: number | '';
}

const initialFormData: FormData = {
  tier: '',
  benefitType: '',
  benefitConfig: '',
  discountPercentage: '',
  maxDiscountAmount: '',
  minOrderAmount: ''
};

export default function CreateTierBenefitWizard({ onSuccess, onCancel }: CreateTierBenefitWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const totalSteps = 4;

  const steps = [
    { number: 1, title: 'Select Tier', description: 'Choose membership tier' },
    { number: 2, title: 'Benefit Type', description: 'Select benefit category' },
    { number: 3, title: 'Configuration', description: 'Set benefit details' },
    { number: 4, title: 'Review', description: 'Confirm and create' }
  ];

  const membershipTiers = [
    { value: MembershipTier.BRONZE, label: 'Bronze', color: 'from-amber-600 to-yellow-700', icon: '🥉' },
    { value: MembershipTier.SILVER, label: 'Silver', color: 'from-gray-400 to-gray-600', icon: '🥈' },
    { value: MembershipTier.GOLD, label: 'Gold', color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
    { value: MembershipTier.PLATINUM, label: 'Platinum', color: 'from-slate-300 to-slate-500', icon: '💎' },
    { value: MembershipTier.DIAMOND, label: 'Diamond', color: 'from-blue-400 to-indigo-600', icon: '💍' }
  ];

  const benefitTypes = [
    { 
      value: BenefitType.DISCOUNT, 
      label: 'Discount', 
      description: 'Percentage discount on orders',
      icon: '💰',
      color: 'from-green-400 to-emerald-600'
    },
    { 
      value: BenefitType.FREE_SHIPPING, 
      label: 'Free Shipping', 
      description: 'Free shipping benefits',
      icon: '🚚',
      color: 'from-blue-400 to-cyan-600'
    },
    { 
      value: BenefitType.PRIORITY_SUPPORT, 
      label: 'Priority Support', 
      description: 'Faster customer support',
      icon: '🎧',
      color: 'from-purple-400 to-indigo-600'
    },
    { 
      value: BenefitType.EXCLUSIVE_ACCESS, 
      label: 'Exclusive Access', 
      description: 'Early access to sales and products',
      icon: '🔐',
      color: 'from-orange-400 to-red-600'
    },
    { 
      value: BenefitType.BIRTHDAY_BONUS, 
      label: 'Birthday Bonus', 
      description: 'Special birthday rewards',
      icon: '🎂',
      color: 'from-pink-400 to-rose-600'
    },
    { 
      value: BenefitType.POINT_MULTIPLIER, 
      label: 'Point Multiplier', 
      description: 'Multiplied points earning',
      icon: '✨',
      color: 'from-yellow-400 to-orange-600'
    }
  ];

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.tier) {
          newErrors.tier = 'Please select a membership tier';
        }
        break;
      case 2:
        if (!formData.benefitType) {
          newErrors.benefitType = 'Please select a benefit type';
        }
        break;
      case 3:
        const validation = TierBenefitsService.validateBenefitConfiguration(
          formData.benefitType as BenefitType,
          formData.discountPercentage as number,
          formData.maxDiscountAmount as number,
          formData.minOrderAmount as number
        );
        if (!validation.valid) {
          validation.errors.forEach((error, index) => {
            newErrors[`config_${index}`] = error;
          });
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const requestData: TierBenefitCreateRequestDto = {
        tier: formData.tier as MembershipTier,
        benefitType: formData.benefitType as BenefitType,
        ...(formData.benefitConfig && { benefitConfig: formData.benefitConfig }),
        ...(formData.discountPercentage && { discountPercentage: Number(formData.discountPercentage) }),
        ...(formData.maxDiscountAmount && { maxDiscountAmount: Number(formData.maxDiscountAmount) }),
        ...(formData.minOrderAmount && { minOrderAmount: Number(formData.minOrderAmount) })
      };

      const result = await TierBenefitsService.createTierBenefit(requestData);
      setIsSuccess(true);
      
      setTimeout(() => {
        onSuccess?.(result);
      }, 2000);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create benefit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitting(false);
    setIsSuccess(false);
  };

  const requiresConfiguration = (benefitType: BenefitType): boolean => {
    return [BenefitType.DISCOUNT, BenefitType.POINT_MULTIPLIER, BenefitType.FREE_SHIPPING].includes(benefitType);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 flex items-center justify-center">
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-green-200/50 dark:border-green-500/20 shadow-2xl p-12 text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-xl animate-bounce">
            <span className="text-4xl text-white">✅</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Success!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Tier benefit has been created successfully
          </p>
          <div className="flex gap-4">
            <button
              onClick={resetForm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Create Another
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-12xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Create Tier Benefit
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Set up rewards and benefits for your membership tiers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8 mb-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step.number < currentStep 
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg' 
                    : step.number === currentStep
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl ring-4 ring-green-200 dark:ring-green-800'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {step.number < currentStep ? '✓' : step.number}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-semibold ${
                    step.number <= currentStep 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-auto max-w-md">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-green-200/50 dark:border-green-500/20 shadow-2xl overflow-hidden">
          <div className="p-8">
            {/* Step 1: Select Tier */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Select Membership Tier
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Choose which membership tier this benefit applies to
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {membershipTiers.map((tier) => (
                    <button
                      key={tier.value}
                      onClick={() => updateFormData('tier', tier.value)}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                        formData.tier === tier.value
                          ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg'
                          : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 hover:border-green-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {tier.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {tier.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {tier.label} tier benefits
                        </p>
                      </div>
                      {formData.tier === tier.value && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {errors.tier && (
                  <p className="text-red-500 text-sm text-center">{errors.tier}</p>
                )}
              </div>
            )}

            {/* Step 2: Select Benefit Type */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Choose Benefit Type
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Select the type of benefit you want to create
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {benefitTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateFormData('benefitType', type.value)}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 text-left ${
                        formData.benefitType === type.value
                          ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg'
                          : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {type.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {type.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {type.description}
                          </p>
                        </div>
                      </div>
                      {formData.benefitType === type.value && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {errors.benefitType && (
                  <p className="text-red-500 text-sm text-center">{errors.benefitType}</p>
                )}
              </div>
            )}

            {/* Step 3: Configuration */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Configure Benefit Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Set up the specific parameters for this benefit
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Benefit Config Description */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {TierBenefitsService.getBenefitTypeIcon(formData.benefitType as BenefitType)}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {TierBenefitsService.getBenefitTypeDisplayName(formData.benefitType as BenefitType)}
                      </h3>
                    </div>
                  </div>

                  {/* Configuration Fields */}
                  {formData.benefitType === BenefitType.DISCOUNT && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Discount Percentage *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            value={formData.discountPercentage}
                            onChange={(e) => updateFormData('discountPercentage', e.target.value)}
                            placeholder="Enter discount percentage"
                            className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 dark:text-white"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            %
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Maximum Discount Amount
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.maxDiscountAmount}
                            onChange={(e) => updateFormData('maxDiscountAmount', e.target.value)}
                            placeholder="Optional maximum discount cap"
                            className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 dark:text-white"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Minimum Order Amount
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.minOrderAmount}
                            onChange={(e) => updateFormData('minOrderAmount', e.target.value)}
                            placeholder="Optional minimum order requirement"
                            className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 dark:text-white"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {formData.benefitType === BenefitType.POINT_MULTIPLIER && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Point Multiplier *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1.1"
                          step="0.1"
                          value={formData.discountPercentage}
                          onChange={(e) => updateFormData('discountPercentage', e.target.value)}
                          placeholder="e.g., 2 for 2x points"
                          className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 dark:text-white"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          x
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.benefitType === BenefitType.FREE_SHIPPING && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        Minimum Order Amount for Free Shipping
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.minOrderAmount}
                          onChange={(e) => updateFormData('minOrderAmount', e.target.value)}
                          placeholder="Leave empty for free shipping on all orders"
                          className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 dark:text-white"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </div>
                      </div>
                    </div>
                  )}

                  {!requiresConfiguration(formData.benefitType as BenefitType) && (
                    <div className="text-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-500/20">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl text-white">✨</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Create!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        This benefit type doesn't require additional configuration
                      </p>
                    </div>
                  )}

                  {/* Custom Configuration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Additional Configuration (Optional)
                    </label>
                    <textarea
                      value={formData.benefitConfig}
                      onChange={(e) => updateFormData('benefitConfig', e.target.value)}
                      placeholder="Any additional configuration or notes..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 dark:text-white resize-none"
                    />
                  </div>

                  {/* Validation Errors */}
                  {Object.keys(errors).filter(key => key.startsWith('config_')).map(key => (
                    <p key={key} className="text-red-500 text-sm">{errors[key]}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Review & Confirm
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Please review the benefit details before creating
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-500/20 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl">
                            {TierBenefitsService.getBenefitTypeIcon(formData.benefitType as BenefitType)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {TierBenefitsService.getBenefitTypeDisplayName(formData.benefitType as BenefitType)}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            For {formData.tier} tier members
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-green-200 dark:border-green-500/20">
                        <div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Membership Tier</span>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{formData.tier}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Benefit Type</span>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {TierBenefitsService.getBenefitTypeDisplayName(formData.benefitType as BenefitType)}
                          </p>
                        </div>
                        {formData.discountPercentage && (
                          <div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                              {formData.benefitType === BenefitType.POINT_MULTIPLIER ? 'Multiplier' : 'Discount'}
                            </span>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {formData.discountPercentage}
                              {formData.benefitType === BenefitType.POINT_MULTIPLIER ? 'x' : '%'}
                            </p>
                          </div>
                        )}
                        {formData.maxDiscountAmount && (
                          <div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Max Discount</span>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              ${formData.maxDiscountAmount}
                            </p>
                          </div>
                        )}
                        {formData.minOrderAmount && (
                          <div>
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Min Order</span>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              ${formData.minOrderAmount}
                            </p>
                          </div>
                        )}
                      </div>

                      {formData.benefitConfig && (
                        <div className="pt-4 border-t border-green-200 dark:border-green-500/20">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Additional Configuration</span>
                          <p className="text-gray-900 dark:text-white mt-1">{formData.benefitConfig}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl">
                      <p className="text-red-700 dark:text-red-400 font-medium">{errors.submit}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 border-t border-gray-200/50 dark:border-gray-600/50">
            <div className="flex justify-between items-center">
              <button
                onClick={currentStep === 1 ? onCancel : prevStep}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-semibold"
              >
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Benefit'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}