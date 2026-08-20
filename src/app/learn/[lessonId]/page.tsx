'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TextbookLearningCards from '../../../../components/TextbookLearningCards';

export default function LessonPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.lessonId as string;
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/lessons/${lessonId}`);
                const data = await response.json().catch(() => null);

                if (!response.ok || !data?.success) {
                    throw new Error(
                        data?.error ||
                        `Failed to load lesson (status ${response.status})`
                    );
                }

                setLesson(data.data);
            } catch (err: any) {
                console.error('Error fetching lesson:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (lessonId) {
            fetchLesson();
        }
    }, [lessonId]);

    const handleComplete = (results: any) => {
        console.log('Lesson completed:', results);
        // Here you could send results to an API to track progress
        router.back(); // Go back to the skills/level page
    };

    const handleExit = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading lesson...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
                    <div className="text-4xl mb-4">😔</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Lesson</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={handleExit} className="btn-primary px-6 py-2">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <TextbookLearningCards
            lesson={lesson}
            onComplete={handleComplete}
            onExit={handleExit}
        />
    );
}
