import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Prerequisite Gate - Controls access to courses and lessons based on prerequisites
 * University-style academic progression enforcement
 */
const PrerequisiteGate = ({ 
    userId, 
    targetCourseId, 
    targetLessonId = null,
    children, 
    onAccessGranted, 
    onAccessDenied,
    showRetryOption = true 
}) => {
    const [prerequisiteCheck, setPrerequisiteCheck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (userId && (targetCourseId || targetLessonId)) {
            checkPrerequisites();
        }
    }, [userId, targetCourseId, targetLessonId, retryCount]);

    const checkPrerequisites = async () => {
        try {
            setLoading(true);
            setError(null);

            const endpoint = targetLessonId 
                ? `/api/lessons/${targetLessonId}/prerequisite-check`
                : `/api/courses/${targetCourseId}/prerequisite-check`;

            const response = await fetch(`${endpoint}?userId=${userId}`);
            
            if (!response.ok) {
                throw new Error('Failed to check prerequisites');
            }

            const data = await response.json();
            
            if (data.success) {
                setPrerequisiteCheck(data);
                
                if (data.accessGranted) {
                    if (onAccessGranted) {
                        onAccessGranted(data);
                    }
                } else {
                    if (onAccessDenied) {
                        onAccessDenied(data);
                    }
                }
            } else {
                throw new Error(data.error || 'Prerequisite check failed');
            }
        } catch (err) {
            console.error('Error checking prerequisites:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRetryCheck = () => {
        setRetryCount(prev => prev + 1);
    };

    const handleGoToPrerequisite = (prerequisite) => {
        // Navigate to the missing prerequisite course
        window.location.href = `/courses/${prerequisite.id}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking prerequisites...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Prerequisites Check Failed</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={handleRetryCheck}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-3"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // If prerequisites are met, render the protected content
    if (prerequisiteCheck?.accessGranted) {
        return <>{children}</>;
    }

    // If prerequisites are not met, show the blocking interface
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="max-w-2xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm p-8 text-center"
                >
                    {/* Access Denied Header */}
                    <div className="text-6xl mb-6">🔐</div>
                    
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Prerequisites Required
                    </h1>
                    
                    <p className="text-gray-600 mb-6">
                        {prerequisiteCheck?.message || 
                        'You need to complete the required prerequisites before accessing this content.'}
                    </p>

                    {/* Missing Prerequisites */}
                    {prerequisiteCheck?.missingPrerequisites && prerequisiteCheck.missingPrerequisites.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Missing Prerequisites:
                            </h2>
                            <div className="space-y-3">
                                {prerequisiteCheck.missingPrerequisites.map((prereq, index) => (
                                    <PrerequisiteItem 
                                        key={index}
                                        prerequisite={prereq}
                                        onGoTo={handleGoToPrerequisite}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Prerequisites */}
                    {prerequisiteCheck?.completedPrerequisites && prerequisiteCheck.completedPrerequisites.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Completed Prerequisites:
                            </h2>
                            <div className="space-y-2">
                                {prerequisiteCheck.completedPrerequisites.map((prereq, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                                    >
                                        <span className="text-green-700">{prereq.name}</span>
                                        <span className="text-green-600 font-medium">✓ Complete</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Academic Progress Requirements */}
                    {prerequisiteCheck?.academicRequirements && (
                        <AcademicRequirements requirements={prerequisiteCheck.academicRequirements} />
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4">
                        {showRetryOption && (
                            <button
                                onClick={handleRetryCheck}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                Check Again
                            </button>
                        )}
                        
                        <button
                            onClick={() => window.location.href = '/courses'}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Browse Courses
                        </button>
                    </div>

                    {/* Academic Advisory */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                            <span className="text-blue-600 text-2xl mr-3">🎓</span>
                            <div className="text-left">
                                <h3 className="font-medium text-blue-900 mb-2">Academic Advisory</h3>
                                <p className="text-blue-700 text-sm">
                                    Prerequisites ensure you have the necessary foundation for success in advanced coursework. 
                                    Complete the required courses to build your skills progressively and achieve better learning outcomes.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

/**
 * Individual Prerequisite Item Component
 */
const PrerequisiteItem = ({ prerequisite, onGoTo }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
    >
        <div className="flex items-center">
            <div className="text-red-500 mr-3">❌</div>
            <div>
                <h3 className="font-medium text-red-900">{prerequisite.name}</h3>
                <p className="text-sm text-red-700">
                    {prerequisite.description || `Level ${prerequisite.level} • ${prerequisite.estimatedHours || '40'}h`}
                </p>
            </div>
        </div>
        
        {prerequisite.id && (
            <button
                onClick={() => onGoTo(prerequisite)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
                Start Course
            </button>
        )}
    </motion.div>
);

/**
 * Academic Requirements Component
 */
const AcademicRequirements = ({ requirements }) => (
    <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Academic Requirements:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(requirements).map(([key, requirement]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                            requirement.met 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {requirement.met ? '✓ Met' : '✗ Required'}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        {requirement.current !== undefined && requirement.required !== undefined && (
                            <div>
                                Current: {requirement.current} | Required: {requirement.required}
                            </div>
                        )}
                        {requirement.description && (
                            <div className="mt-1">{requirement.description}</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default PrerequisiteGate;