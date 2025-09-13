import React, { useState, useRef } from 'react';
import { Form, FormField } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FormEditor } from '../components/FormEditor';
import { LoadingGuard } from '../components/LoadingGuard';
import { Plus, FileText, Users, Eye, Trash2, Edit, UserCheck, Paperclip, BarChart3, Calendar, ChevronDown } from 'lucide-react';
import { PendingApprovals } from '../components/PendingApprovals';
import { VideoSection } from '../components/VideoSection';
import { directorVideos } from '../data/videoData';
import { DashboardCreationModal } from '../components/DashboardCreationModal';

export const DirecteurDashboard: React.FC = () => {
  const { user, firebaseUser, isLoading } = useAuth();
  const { 
    forms,
    formEntries,
    employees,
    createForm, 
    updateForm,
    deleteForm,
    getEntriesForForm,
    getPendingEmployees,
    refreshData,
    createDashboard,
    isLoading: appLoading
  } = useApp();
  
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // États pour le filtrage temporel
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: '',
    end: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const handleCreateForm = async (formData: {
    title: string;
    description: string;
    fields: FormField[];
    assignedTo: string[];
    timeRestrictions?: {
      startTime?: string;
      endTime?: string;
      allowedDays?: number[];
    };
  }) => {
    try {
      if (!user?.id || !user?.agencyId) {
        throw new Error('Données utilisateur manquantes');
      }

      await createForm({
        ...formData,
        createdBy: user.id,
        agencyId: user.agencyId,
      });
      setShowFormBuilder(false);
      setEditingForm(null);
    } catch (error) {
      console.error('Erreur lors de la création du formulaire:', error);
      alert('Erreur lors de la création du formulaire. Veuillez réessayer.');
    }
  };

  const handleUpdateForm = async (formData: {
    title: string;
    description: string;
    fields: FormField[];
    assignedTo: string[];
    timeRestrictions?: {
      startTime?: string;
      endTime?: string;
      allowedDays?: number[];
    };
  }) => {
    if (!editingForm) return;

    try {
      await updateForm(editingForm.id, formData);
      setEditingForm(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du formulaire:', error);
      alert('Erreur lors de la mise à jour du formulaire. Veuillez réessayer.');
    }
  };

  const handleEditForm = (form: Form) => {
    setEditingForm(form);
  };

  const handleCancelEdit = () => {
    setEditingForm(null);
    setShowFormBuilder(false);
  };

  const handleCreateDashboard = async (dashboardData: any) => {
    try {
      await createDashboard(dashboardData);
      setShowDashboardModal(false);
    } catch (error) {
      console.error('Erreur lors de la création du tableau de bord:', error);
      alert('Erreur lors de la création du tableau de bord. Veuillez réessayer.');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
      try {
        await deleteForm(formId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du formulaire.');
      }
    }
  };


  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Fonctions pour le filtrage temporel
  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterday, end: today };
      case 'last7days':
        const last7days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: last7days, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'last30days':
        const last30days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start: last30days, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'thisweek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'lastweek':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay());
        return { start: lastWeekStart, end: lastWeekEnd };
      case 'thismonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'lastmonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: lastMonthStart, end: lastMonthEnd };
      case 'thisquarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        return { start: startOfQuarter, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'lastquarter':
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
        const lastQuarterStart = new Date(now.getFullYear(), lastQuarter * 3, 1);
        const lastQuarterEnd = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 1);
        return { start: lastQuarterStart, end: lastQuarterEnd };
      case 'thisyear':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'lastyear':
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear(), 0, 1);
        return { start: lastYearStart, end: lastYearEnd };
      case 'custom':
        return {
          start: customDateRange.start ? new Date(customDateRange.start) : null,
          end: customDateRange.end ? new Date(customDateRange.end) : null
        };
      default:
        return { start: null, end: null }; // All time
    }
  };

  const isDateInRange = (date: Date, start: Date | null, end: Date | null) => {
    if (!start && !end) return true; // All time
    if (!start) return date <= end!;
    if (!end) return date >= start;
    return date >= start && date <= end;
  };

  const getFilteredData = () => {
    const { start, end } = getDateRange(timeFilter);
    
    const filteredForms = forms.filter(form => 
      isDateInRange(form.createdAt, start, end)
    );
    
    const filteredFormEntries = formEntries.filter(entry => 
      isDateInRange(new Date(entry.submittedAt), start, end)
    );
    
    const filteredEmployees = employees.filter(emp => 
      emp.createdAt && isDateInRange(emp.createdAt, start, end)
    );
    
    return {
      forms: filteredForms,
      formEntries: filteredFormEntries,
      employees: filteredEmployees
    };
  };

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp?.id === employeeId);
    return employee?.name || 'Employé inconnu';
  };


  const formatTimeRestrictions = (restrictions?: {
    startTime?: string;
    endTime?: string;
    allowedDays?: number[];
  }): string => {
    if (!restrictions || (!restrictions.startTime && !restrictions.endTime)) {
      return '';
    }

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    let timeStr = '';
    if (restrictions.startTime && restrictions.endTime) {
      timeStr = `${restrictions.startTime} - ${restrictions.endTime}`;
    } else if (restrictions.startTime) {
      timeStr = `À partir de ${restrictions.startTime}`;
    } else if (restrictions.endTime) {
      timeStr = `Jusqu'à ${restrictions.endTime}`;
    }

    let dayStr = '';
    if (restrictions.allowedDays && restrictions.allowedDays.length > 0) {
      const selectedDays = restrictions.allowedDays
        .sort((a, b) => a - b)
        .map(day => dayNames[day])
        .join(', ');
      dayStr = ` (${selectedDays})`;
    }

    return `${timeStr}${dayStr}`;
  };


  return (
    <LoadingGuard 
      isLoading={isLoading || appLoading} 
      user={user} 
      firebaseUser={firebaseUser}
      message="Chargement du dashboard directeur..."
    >
      {user?.role !== 'directeur' ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Accès refusé</h1>
            <p className="text-gray-600">Seuls les directeurs peuvent accéder à cette page.</p>
          </Card>
        </div>
      ) : showFormBuilder || editingForm ? (
        <Layout title={editingForm ? "Modifier le formulaire" : "Créer un formulaire"}>
          <FormEditor
            form={editingForm || undefined}
            onSave={editingForm ? handleUpdateForm : handleCreateForm}
            onCancel={handleCancelEdit}
            employees={employees}
          />
        </Layout>
      ) : (
        <Layout title="Dashboard Directeur">
          <div className="space-y-6 lg:space-y-8">
            {/* Filtre temporel compact */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Période:</span>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Dropdown des périodes prédéfinies */}
                <div className="relative">
                  <select
                    value={timeFilter}
                    onChange={(e) => {
                      setTimeFilter(e.target.value);
                      if (e.target.value !== 'custom') {
                        setShowCustomDatePicker(false);
                      }
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-7 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                  >
                    <option value="all">Toutes les périodes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="yesterday">Hier</option>
                    <option value="last7days">7 derniers jours</option>
                    <option value="last30days">30 derniers jours</option>
                    <option value="thisweek">Cette semaine</option>
                    <option value="lastweek">Semaine dernière</option>
                    <option value="thismonth">Ce mois</option>
                    <option value="lastmonth">Mois dernier</option>
                    <option value="thisquarter">Ce trimestre</option>
                    <option value="lastquarter">Trimestre dernier</option>
                    <option value="thisyear">Cette année</option>
                    <option value="lastyear">Année dernière</option>
                    <option value="custom">Période personnalisée</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Bouton pour ouvrir le sélecteur de dates personnalisées */}
                {timeFilter === 'custom' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Dates</span>
                  </Button>
                )}
              </div>
            </div>
              
            {/* Sélecteur de dates personnalisées */}
            {showCustomDatePicker && timeFilter === 'custom' && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCustomDatePicker(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowCustomDatePicker(false)}
                      disabled={!customDateRange.start || !customDateRange.end}
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>
              )}

            {/* Statistiques */}
            {(() => {
              const filteredData = getFilteredData();
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 opacity-80" />
                      <div>
                        <p className="text-blue-100">Formulaires créés</p>
                        <p className="text-xl sm:text-2xl font-bold">{filteredData.forms.length}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 opacity-80" />
                      <div>
                        <p className="text-green-100">Employés approuvés</p>
                        <p className="text-xl sm:text-2xl font-bold">{filteredData.employees.filter(emp => emp.isApproved !== false).length}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                    <div className="flex items-center space-x-3">
                      <UserCheck className="h-8 w-8 opacity-80" />
                      <div>
                        <p className="text-yellow-100">En attente</p>
                        <p className="text-xl sm:text-2xl font-bold">{getPendingEmployees().length}</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-8 w-8 opacity-80" />
                      <div>
                        <p className="text-purple-100">Réponses totales</p>
                        <p className="text-xl sm:text-2xl font-bold">{filteredData.formEntries.length}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })()}

            {/* Section des approbations en attente */}
            <PendingApprovals
              pendingEmployees={getPendingEmployees()}
              currentDirectorId={user?.id || ''}
              onApprovalChange={refreshData}
            />

            {/* Actions principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button
                onClick={() => setShowFormBuilder(true)}
                className="flex items-center justify-center space-x-2 w-full"
              >
                <Plus className="h-5 w-5" />
                <span>Créer un nouveau formulaire</span>
              </Button>
              
              <Button
                onClick={() => setShowDashboardModal(true)}
                variant="secondary"
                className="flex items-center justify-center space-x-2 w-full"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Créer un nouveau tableau de bord</span>
              </Button>
            </div>

            {/* Liste des formulaires */}
            <Card title="Formulaires créés">
              {(() => {
                const filteredData = getFilteredData();
                return filteredData.forms.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      {timeFilter === 'all' 
                        ? 'Aucun formulaire créé pour le moment'
                        : 'Aucun formulaire créé dans cette période'
                      }
                    </p>
                    {timeFilter === 'all' && (
                      <Button onClick={() => setShowFormBuilder(true)}>
                        Créer votre premier formulaire
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <div ref={scrollContainerRef} className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide horizontal-scroll-forms">
                    {filteredData.forms.map(form => {
                    const formEntriesForForm = getEntriesForForm(form.id);
                    
                    return (
                      <div
                        key={form.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-300 mobile-form-card flex-shrink-0 w-80 sm:w-96"
                      >
                        {/* Header avec titre et badge */}
                        <div className="mb-3">
                          <div className="flex flex-col space-y-2">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg line-clamp-2 leading-tight">
                              {form.title}
                            </h3>
                            {form.timeRestrictions && formatTimeRestrictions(form.timeRestrictions) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                🕒 {formatTimeRestrictions(form.timeRestrictions)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                          {form.description}
                        </p>

                        {/* Statistiques */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-gray-900">{formEntriesForForm.length}</div>
                            <div className="text-xs text-gray-600">Réponse(s)</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-gray-900">{form.fields.length}</div>
                            <div className="text-xs text-gray-600">Champ(s)</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-gray-900">{form.assignedTo.length}</div>
                            <div className="text-xs text-gray-600">Employé(s)</div>
                          </div>
                        </div>

                        {/* Date de création */}
                        <div className="text-xs text-gray-500 mb-4">
                          Créé le {form.createdAt.toLocaleDateString()}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2 form-card-actions">
                          <div className="flex space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditForm(form)}
                              className="flex-1 flex items-center justify-center space-x-1 text-xs"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Modifier</span>
                            </Button>
                            
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedFormId(
                                selectedFormId === form.id ? null : form.id
                              )}
                              className="flex-1 flex items-center justify-center space-x-1 text-xs"
                            >
                              <Eye className="h-3 w-3" />
                              <span>{selectedFormId === form.id ? 'Masquer' : 'Voir'}</span>
                            </Button>
                          </div>
                          
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteForm(form.id)}
                            className="w-full flex items-center justify-center space-x-1 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Supprimer</span>
                          </Button>
                        </div>
                        
                        {/* Affichage des réponses */}
                        {selectedFormId === form.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {formEntriesForForm.length === 0 ? (
                              <p className="text-gray-500 italic text-center py-2">Aucune réponse pour ce formulaire</p>
                            ) : (
                              <div className="space-y-3 max-h-80 overflow-y-auto">
                                {formEntriesForForm.map(entry => (
                                  <div key={entry.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="flex flex-col space-y-2 mb-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-blue-900">
                                          {getEmployeeName(entry.userId)}
                                        </span>
                                        <span className="text-xs text-blue-600">
                                          {new Date(entry.submittedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      {Object.entries(entry.answers || {}).slice(0, 3).map(([fieldId, value]) => {
                                        const field = form.fields.find(f => f.id === fieldId);
                                        const fieldLabel = field?.label || fieldId;
                                        
                                        return (
                                          <div key={fieldId} className="text-xs">
                                            <span className="font-medium text-blue-800">{fieldLabel}:</span>
                                            <span className="ml-1 text-blue-900">
                                              {value !== null && value !== undefined ? 
                                                (typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')) : 
                                                '-'
                                              }
                                            </span>
                                          </div>
                                        );
                                      })}
                                      {Object.keys(entry.answers || {}).length > 3 && (
                                        <div className="text-xs text-blue-600 italic">
                                          +{Object.keys(entry.answers || {}).length - 3} autres champs...
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* File Attachments */}
                                    {entry.fileAttachments && entry.fileAttachments.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-blue-200">
                                        <div className="flex items-center space-x-1">
                                          <Paperclip className="h-3 w-3 text-blue-600" />
                                          <span className="text-xs text-blue-700">{entry.fileAttachments.length} fichier(s)</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                  
                    {/* Indicateurs de scroll */}
                    {filteredData.forms.length > 1 && (
                      <>
                        <div className="scroll-indicator scroll-indicator-left hidden md:flex" onClick={scrollLeft}>
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </div>
                        <div className="scroll-indicator scroll-indicator-right hidden md:flex" onClick={scrollRight}>
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </Card>

            {/* Video Section */}
            <VideoSection 
              title="Vidéos de formation pour directeurs"
              videos={directorVideos}
              className="mt-6"
            />

          </div>
        </Layout>
      )}

      {/* Dashboard Creation Modal */}
      <DashboardCreationModal
        isOpen={showDashboardModal}
        onClose={() => setShowDashboardModal(false)}
        onSave={handleCreateDashboard}
        forms={forms}
        currentUserId={user?.id || ''}
        agencyId={user?.agencyId || ''}
      />
    </LoadingGuard>
  );
};