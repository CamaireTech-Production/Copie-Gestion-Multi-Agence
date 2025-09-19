import { useAuth } from '../contexts/AuthContext';
import { 
  hasPackageFeature, 
  getPackageLimit, 
  isUnlimited, 
  PackageType, 
  PackageFeatures, 
  PackageLimits 
} from '../config/packageFeatures';

// Hook principal pour vérifier l'accès aux fonctionnalités
export const usePackageAccess = () => {
  const { user } = useAuth();

  // Vérifier si l'utilisateur a accès à une fonctionnalité spécifique
  const hasFeature = (feature: keyof PackageFeatures): boolean => {
    if (!user?.package) return false;
    
    // Pour les packages custom, vérifier les fonctionnalités personnalisées
    if (user.package === 'custom' && user.packageFeatures) {
      return user.packageFeatures.includes(feature);
    }
    
    return hasPackageFeature(user.package, feature);
  };

  // Vérifier si l'utilisateur respecte une limite spécifique (incluant pay-as-you-go)
  const checkLimit = (limit: keyof PackageLimits, currentValue: number): boolean => {
    if (!user?.package) return false;
    
    const limitValue = getPackageLimit(user.package, limit);
    
    // Si la limite est illimitée (-1), toujours autoriser
    if (isUnlimited(user.package, limit)) {
      return true;
    }
    
    // Ajouter la capacité pay-as-you-go
    const payAsYouGoCapacity = getPayAsYouGoCapacity(limit);
    const totalCapacity = limitValue + payAsYouGoCapacity;
    
    return currentValue < totalCapacity;
  };

  // Obtenir la valeur d'une limite
  const getLimit = (limit: keyof PackageLimits): number => {
    if (!user?.package) return 0;
    return getPackageLimit(user.package, limit);
  };

  // Vérifier si une limite est illimitée
  const isLimitUnlimited = (limit: keyof PackageLimits): boolean => {
    if (!user?.package) return false;
    return isUnlimited(user.package, limit);
  };

  // Obtenir le type de package de l'utilisateur
  const getPackageType = (): PackageType | null => {
    return user?.package || null;
  };

  // Vérifier si l'utilisateur peut créer un nouveau formulaire
  const canCreateForm = (currentFormCount: number): boolean => {
    const result = checkLimit('maxForms', currentFormCount);
    console.log('🔍 canCreateForm Debug:', {
      currentFormCount,
      userPackage: user?.package,
      packageLimit: getLimit('maxForms'),
      payAsYouGoCapacity: getPayAsYouGoCapacity('maxForms'),
      totalCapacity: getTotalLimit('maxForms'),
      payAsYouGoResources: user?.payAsYouGoResources,
      result
    });
    return result;
  };

  // Vérifier si l'utilisateur peut créer un nouveau tableau de bord
  const canCreateDashboard = (currentDashboardCount: number): boolean => {
    return checkLimit('maxDashboards', currentDashboardCount);
  };

  // Vérifier si l'utilisateur peut ajouter un nouvel utilisateur
  const canAddUser = (currentUserCount: number): boolean => {
    return checkLimit('maxUsers', currentUserCount);
  };

  // Obtenir le nombre de tokens mensuels disponibles
  const getMonthlyTokens = (): number => {
    return getLimit('monthlyTokens');
  };

  // Vérifier si l'utilisateur a des tokens illimités
  const hasUnlimitedTokens = (): boolean => {
    return isLimitUnlimited('monthlyTokens');
  };

  // Vérifier si l'utilisateur peut utiliser une fonctionnalité IA avancée
  const canUseAdvancedAI = (): boolean => {
    return hasFeature('advancedAI') || hasFeature('predictiveAI');
  };

  // Vérifier si l'utilisateur peut utiliser le branding personnalisé
  const canUseCustomBranding = (): boolean => {
    return hasFeature('customBranding');
  };

  // Vérifier si l'utilisateur peut utiliser les intégrations personnalisées
  const canUseCustomIntegrations = (): boolean => {
    return hasFeature('customIntegrations');
  };

  // Obtenir le coût d'un utilisateur supplémentaire
  const getAdditionalUserCost = (): number => {
    return getLimit('additionalUserCost');
  };

  // Obtenir la capacité pay-as-you-go pour un type de limite
  const getPayAsYouGoCapacity = (limit: keyof PackageLimits): number => {
    if (!user?.payAsYouGoResources) return 0;
    
    let resourceType: 'forms' | 'dashboards' | 'users' | 'tokens';
    switch (limit) {
      case 'maxForms':
        resourceType = 'forms';
        break;
      case 'maxDashboards':
        resourceType = 'dashboards';
        break;
      case 'maxUsers':
        resourceType = 'users';
        break;
      case 'monthlyTokens':
        resourceType = 'tokens';
        break;
      default:
        return 0;
    }
    
    // Get the additional capacity from pay-as-you-go resources
    return user.payAsYouGoResources[resourceType] || 0;
  };

  // Obtenir la limite totale (package + pay-as-you-go)
  const getTotalLimit = (limit: keyof PackageLimits): number => {
    const packageLimit = getLimit(limit);
    if (packageLimit === -1) return -1; // Unlimited
    
    const payAsYouGoCapacity = getPayAsYouGoCapacity(limit);
    return packageLimit + payAsYouGoCapacity;
  };

  return {
    // Fonctions de base
    hasFeature,
    checkLimit,
    getLimit,
    isLimitUnlimited,
    getPackageType,
    
    // Fonctions spécifiques aux formulaires
    canCreateForm,
    canCreateDashboard,
    canAddUser,
    
    // Fonctions spécifiques aux tokens
    getMonthlyTokens,
    hasUnlimitedTokens,
    
    // Fonctions spécifiques aux fonctionnalités
    canUseAdvancedAI,
    canUseCustomBranding,
    canUseCustomIntegrations,
    
    // Fonctions de coût
    getAdditionalUserCost,
    
    // Fonctions pay-as-you-go
    getPayAsYouGoCapacity,
    getTotalLimit,
    
    // Informations sur l'utilisateur
    user,
    packageType: user?.package || null
  };
};

// Hook simplifié pour vérifier une fonctionnalité spécifique
export const useFeatureAccess = (feature: keyof PackageFeatures) => {
  const { hasFeature } = usePackageAccess();
  return hasFeature(feature);
};

// Hook pour vérifier les limites
export const usePackageLimits = () => {
  const { checkLimit, getLimit, isLimitUnlimited } = usePackageAccess();
  
  return {
    checkLimit,
    getLimit,
    isLimitUnlimited
  };
};
