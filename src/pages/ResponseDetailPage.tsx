import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LoadingGuard } from '../components/LoadingGuard';
import { ArrowLeft, FileText, User, Calendar, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { FileAttachment } from '../types';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';

export const ResponseDetailPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, firebaseUser, isLoading } = useAuth();
  const { 
    forms, 
    formEntries, 
    employees, 
    getEntriesForForm,
    getEntriesForEmployee,
    updateFormEntry,
    isLoading: appLoading
  } = useApp();
  const { toast, showSuccess, showError } = useToast();

  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Get the form and responses
  const form = forms.find(f => f.id === formId);
  const isEmployee = user?.role === 'employe';
  const isDirector = user?.role === 'directeur';

  // Get responses based on user role
  const allResponses = formId ? (
    isEmployee 
      ? getEntriesForEmployee(user?.id || '').filter(entry => entry.formId === formId)
      : getEntriesForForm(formId)
  ) : [];

  // Helper functions for file handling
  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    if (fileType.includes('text')) return '📄';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewPDF = (fileAttachment: FileAttachment) => {
    if (fileAttachment.downloadUrl) {
      window.open(fileAttachment.downloadUrl, '_blank');
    }
  };

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(emp => emp?.id === employeeId);
    return employee?.name || 'Employé inconnu';
  };

  const canEditResponse = (submittedAt: Date | string) => {
    const submittedTime = new Date(submittedAt);
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    return submittedTime > threeHoursAgo;
  };

  const getFilteredAndSortedResponses = () => {
    let filtered = [...allResponses];

    // Filter by employee (only for directors)
    if (isDirector && selectedEmployeeFilter !== 'all') {
      filtered = filtered.filter(response => response.userId === selectedEmployeeFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(response => {
            const responseDate = new Date(response.submittedAt);
            return responseDate >= today;
          });
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(response => {
            const responseDate = new Date(response.submittedAt);
            return responseDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filtered = filtered.filter(response => {
            const responseDate = new Date(response.submittedAt);
            return responseDate >= monthAgo;
          });
          break;
      }
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const handleUpdateResponse = async (responseId: string, updatedAnswers: Record<string, any>, updatedFileAttachments: any[]) => {
    try {
      await updateFormEntry(responseId, {
        answers: updatedAnswers,
        fileAttachments: updatedFileAttachments
      });
      
      showSuccess('Réponse mise à jour avec succès');
      setEditingResponse(null);
      
    } catch (error) {
      console.error('Error updating response:', error);
      showError('Erreur lors de la mise à jour de la réponse');
    }
  };

  const handleBack = () => {
    if (isEmployee) {
      navigate('/employe/dashboard');
    } else {
      navigate('/directeur/dashboard');
    }
  };

  const filteredResponses = getFilteredAndSortedResponses();

  if (!form) {
    return (
      <LoadingGuard 
        isLoading={isLoading || appLoading} 
        user={user} 
        firebaseUser={firebaseUser}
        message="Chargement des détails de la réponse..."
      >
        <Layout title="Réponse non trouvée">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Formulaire non trouvé</h2>
            <p className="text-gray-600 mb-4">Le formulaire demandé n'existe pas ou vous n'avez pas l'autorisation de le consulter.</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
          </div>
        </Layout>
      </LoadingGuard>
    );
  }

  return (
    <LoadingGuard 
      isLoading={isLoading || appLoading} 
      user={user} 
      firebaseUser={firebaseUser}
      message="Chargement des détails de la réponse..."
    >
      <Layout title={`Réponses - ${form.title}`}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
                <p className="text-gray-600">{form.description}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <div className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Employee filter (only for directors) */}
                {isDirector && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <select
                      value={selectedEmployeeFilter}
                      onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tous les employés</option>
                      {employees
                        .filter(emp => allResponses.some(response => response.userId === emp.id))
                        .map(employee => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Date filter */}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Toutes les périodes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>
                </div>

                {/* Sort order */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Filter className="h-4 w-4" />
                    <span>{sortOrder === 'asc' ? 'Plus ancien' : 'Plus récent'}</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Results count */}
          <div className="text-sm text-gray-600">
            {filteredResponses.length} réponse(s) trouvée(s)
          </div>

          {/* Responses list */}
          <div className="space-y-4">
            {filteredResponses.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune réponse trouvée avec ces filtres</p>
                </div>
              </Card>
            ) : (
              filteredResponses.map((response, index) => {
                const isEditable = isEmployee && canEditResponse(response.submittedAt);
                const isEditing = editingResponse === response.id;
                
                return (
                  <Card key={response.id}>
                    <div className="p-6">
                      {isEditing ? (
                        /* Edit Form - This would need a DynamicForm component */
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Modifier la réponse</h3>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingResponse(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                          <p className="text-gray-600">Fonctionnalité d'édition à implémenter</p>
                        </div>
                      ) : (
                        /* Response Display */
                        <>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {isEmployee ? `Ma réponse #${index + 1}` : `Réponse de ${getEmployeeName(response.userId)}`}
                                </h3>
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(response.submittedAt).toLocaleDateString()} à {new Date(response.submittedAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                {isDirector && (
                                  <div className="flex items-center space-x-1">
                                    <User className="h-4 w-4" />
                                    <span>{getEmployeeName(response.userId)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {isEditable && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setEditingResponse(response.id)}
                                  className="flex items-center space-x-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Modifier</span>
                                </Button>
                              )}
                              {!isEditable && isEmployee && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Non modifiable (3h+)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Response details */}
                          <div className="space-y-4">
                            {Object.entries(response.answers || {}).map(([fieldId, value]) => {
                              const field = form.fields.find(f => f.id === fieldId);
                              const fieldLabel = field?.label || fieldId;
                              
                              return (
                                <div key={fieldId} className="border-b border-gray-100 pb-3 last:border-b-0">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="font-medium text-gray-700 text-sm">
                                      {fieldLabel}
                                    </div>
                                    <div className="text-gray-900 text-sm">
                                      {value !== null && value !== undefined ? 
                                        (typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)) : 
                                        '-'
                                      }
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* File attachments */}
                          {response.fileAttachments && response.fileAttachments.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <div className="flex items-center space-x-1 mb-4">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                  {response.fileAttachments.length} fichier(s) joint(s)
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {response.fileAttachments.map((attachment: FileAttachment, attachmentIndex: number) => (
                                  <div key={attachmentIndex} className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-lg">{getFileIcon(attachment.fileType)}</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm text-gray-900 truncate">
                                            {attachment.fileName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {formatFileSize(attachment.fileSize)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <button
                                        onClick={() => handleViewPDF(attachment)}
                                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                      >
                                        <Eye className="h-3 w-3" />
                                        <span>Voir</span>
                                      </button>
                                      
                                      {attachment.downloadUrl && (
                                        <a
                                          href={attachment.downloadUrl}
                                          download={attachment.fileName}
                                          className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                        >
                                          <Download className="h-3 w-3" />
                                          <span>Télécharger</span>
                                        </a>
                                      )}
                                    </div>
                                    
                                    {/* Show extraction status for AI processing */}
                                    {attachment.textExtractionStatus && (
                                      <div className="mt-2">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          attachment.textExtractionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                          attachment.textExtractionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          IA: {attachment.textExtractionStatus === 'completed' ? 'Prête' : 
                                               attachment.textExtractionStatus === 'failed' ? 'Échouée' : 'En cours'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Toast Notification */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
        />
      </Layout>
    </LoadingGuard>
  );
};
