#!/usr/bin/env python3

def cleanup_garbage():
    with open('react-app.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the end of PracticeSection component
    practice_section_end = content.find('        };\n\n        \n                            <div key={verbIndex}')
    
    if practice_section_end == -1:
        print("Could not find the end of PracticeSection")
        return
        
    # Find the start of the next proper component
    conjugation_exercise_start = content.find('\n        // ConjugationExercise Component\n        const ConjugationExercise')
    
    if conjugation_exercise_start == -1:
        print("Could not find ConjugationExercise Component")
        return
    
    # Replace the garbage section with clean spacing
    before_garbage = content[:practice_section_end + len('        };\n')]
    after_garbage = content[conjugation_exercise_start:]
    
    clean_content = before_garbage + '\n' + after_garbage
    
    with open('react-app.html', 'w', encoding='utf-8') as f:
        f.write(clean_content)
    
    print("Cleaned up garbage code between PracticeSection and ConjugationExercise")

if __name__ == "__main__":
    cleanup_garbage()