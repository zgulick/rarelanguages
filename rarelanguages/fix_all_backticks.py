#!/usr/bin/env python3

def fix_all_backticks():
    with open('learning-app-react.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # All the specific fixes based on the found issues
    fixes = [
        # Line 1243
        ('className={`progress-step ${index < currentStepIndex ? \'completed\' : \'\'} ${index === currentStepIndex ? \'active\' : \'\'}`}',
         'className={\\`progress-step \\${index < currentStepIndex ? \'completed\' : \'\'} \\${index === currentStepIndex ? \'active\' : \'\'}\\`}'),
        
        # Lines 1466-1467
        ('usage: item.cultural_context || `Essential ${topic.name.toLowerCase()} phrase`,',
         'usage: item.cultural_context || \\`Essential \\${topic.name.toLowerCase()} phrase\\`,'),
        ('example: `${item.target_phrase} (${item.english_phrase})`',
         'example: \\`\\${item.target_phrase} (\\${item.english_phrase})\\`'),
        
        # Lines 1716-1736 (verb conjugation examples)
        ('english: `I ${verb.english_translation.replace(\'to \', \'\')}`',
         'english: \\`I \\${verb.english_translation.replace(\'to \', \'\')}\\`'),
        ('english: `you ${verb.english_translation.replace(\'to \', \'\')}`',
         'english: \\`you \\${verb.english_translation.replace(\'to \', \'\')}\\`'),
        ('english: `he/she ${verb.english_translation.replace(\'to \', \'\')}s`',
         'english: \\`he/she \\${verb.english_translation.replace(\'to \', \'\')}s\\`'),
        ('english: `we ${verb.english_translation.replace(\'to \', \'\')}`',
         'english: \\`we \\${verb.english_translation.replace(\'to \', \'\')}\\`'),
        ('english: `you (plural) ${verb.english_translation.replace(\'to \', \'\')}`',
         'english: \\`you (plural) \\${verb.english_translation.replace(\'to \', \'\')}\\`'),
        ('english: `they ${verb.english_translation.replace(\'to \', \'\')}`',
         'english: \\`they \\${verb.english_translation.replace(\'to \', \'\')}\\`'),
        
        # Lines 1751-1752, 1758-1759
        ('albanian: `Unë ${presentForms[\'unë\']} çdo ditë`,',
         'albanian: \\`Unë \\${presentForms[\'unë\']} çdo ditë\\`,'),
        ('english: `I ${verb.english_translation.replace(\'to \', \'\')} every day`',
         'english: \\`I \\${verb.english_translation.replace(\'to \', \'\')} every day\\`'),
        ('albanian: `Ne ${presentForms[\'ne\']} bashkë`,',
         'albanian: \\`Ne \\${presentForms[\'ne\']} bashkë\\`,'),
        ('english: `We ${verb.english_translation.replace(\'to \', \'\')} together`',
         'english: \\`We \\${verb.english_translation.replace(\'to \', \'\')} together\\`'),
        
        # Line 1807
        ('{error ? `Error: ${error}` : \'No verbs available for this topic\'}',
         '{error ? \\`Error: \\${error}\\` : \'No verbs available for this topic\'}'),
        
        # Line 1833
        ('className={`verb-tab ${index === activeVerb ? \'active\' : \'\'}`}',
         'className={\\`verb-tab \\${index === activeVerb ? \'active\' : \'\'}\\`}'),
        
        # Line 2518
        ('border: `2px solid ${verb.type.includes(\'irregular\') ? \'#ef4444\' : \'#10b981\'}`,',
         'border: \\`2px solid \\${verb.type.includes(\'irregular\') ? \'#ef4444\' : \'#10b981\'}\\`,'),
        
        # Line 3442
        ('[`topics.${topic.id}`]: accuracy',
         '[\\`topics.\\${topic.id}\\`]: accuracy'),
        
        # Line 3487
        ('width: `${(currentExercise / exercises.length) * 100}%`,',
         'width: \\`\\${(currentExercise / exercises.length) * 100}%\\`,'),
        
        # Lines 3571, 3679
        ('className={`option-button ${selectedAnswer === option ? \'selected\' : \'\'}`}',
         'className={\\`option-button \\${selectedAnswer === option ? \'selected\' : \'\'}\\`}'),
        
        # Lines 3593, 3701
        ('border: `2px solid ${selectedAnswer === data.correct ? \'#10b981\' : \'#ef4444\'}`,',
         'border: \\`2px solid \\${selectedAnswer === data.correct ? \'#10b981\' : \'#ef4444\'}\\`,'),
        
        # Line 3789
        ('border: `2px solid ${userTranslation.toLowerCase().trim() === data.correct.toLowerCase().trim() ? \'#10b981\' : \'#f59e0b\'}`,',
         'border: \\`2px solid \\${userTranslation.toLowerCase().trim() === data.correct.toLowerCase().trim() ? \'#10b981\' : \'#f59e0b\'}\\`,'),
        
        # Line 3850
        ('<span key={n} className={`star ${n <= difficulty ? \'\' : \'empty\'}`}>',
         '<span key={n} className={\\`star \\${n <= difficulty ? \'\' : \'empty\'}\\`}>'),
        
        # Line 3937
        ('className={`option-button ${selectedOption === index ? \'selected\' : \'\'}`}',
         'className={\\`option-button \\${selectedOption === index ? \'selected\' : \'\'}\\`}'),
        
        # Line 4032
        ('className={`visual-option ${selectedOption === index ? \'selected\' : \'\'}`}',
         'className={\\`visual-option \\${selectedOption === index ? \'selected\' : \'\'}\\`}'),
        
        # Line 4046
        ('border: `2px solid ${selectedOption === correctAnswer ? \'#10b981\' : \'#ef4444\'}`,',
         'border: \\`2px solid \\${selectedOption === correctAnswer ? \'#10b981\' : \'#ef4444\'}\\`,'),
    ]
    
    # Apply all fixes
    fixed_content = content
    for old, new in fixes:
        if old in fixed_content:
            fixed_content = fixed_content.replace(old, new)
            print(f"Fixed: {old[:50]}...")
        else:
            print(f"NOT FOUND: {old[:50]}...")
    
    # Write the fixed version
    with open('learning-app-react.js', 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print("All backticks fixed in learning-app-react.js")

if __name__ == "__main__":
    fix_all_backticks()