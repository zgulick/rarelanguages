/**
 * JSON Schemas for OpenAI Structured Outputs
 * Guarantees valid JSON responses from LLM
 */

const vocabularySchema = {
  type: "object",
  properties: {
    words: {
      type: "array",
      items: {
        type: "object",
        properties: {
          english: { type: "string" },
          target: { type: "string" },
          pronunciation: {
            type: "object",
            properties: {
              ipa: { type: "string" },
              sounds_like: { type: "string" },
              syllables: { type: "string" },
              stress: { type: "string" }
            },
            required: ["ipa", "sounds_like", "syllables", "stress"]
          },
          memory_aid: { type: "string" },
          usage_notes: { type: "string" },
          example_sentence: {
            type: "object",
            properties: {
              target: { type: "string" },
              english: { type: "string" },
              literal: { type: "string" }
            },
            required: ["target", "english", "literal"]
          },
          related_words: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["english", "target", "pronunciation", "memory_aid", "usage_notes", "example_sentence", "related_words"]
      }
    },
    patterns_identified: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["words", "patterns_identified"],
  additionalProperties: false
};

const lessonOverviewSchema = {
  type: "object",
  properties: {
    learning_objectives: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5
    },
    prerequisites: {
      type: "array",
      items: { type: "string" }
    },
    estimated_minutes: { type: "integer", minimum: 10, maximum: 20 },
    difficulty_level: { type: "integer", minimum: 1, maximum: 5 },
    difficulty_justification: { type: "string" },
    key_takeaways: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 3
    }
  },
  required: ["learning_objectives", "prerequisites", "estimated_minutes", "difficulty_level", "difficulty_justification", "key_takeaways"],
  additionalProperties: false
};

const lessonIntroductionSchema = {
  type: "object",
  properties: {
    content: { type: "string" },
    scenario: { type: "string" }
  },
  required: ["content", "scenario"],
  additionalProperties: false
};

const grammarExplanationSchema = {
  type: "object",
  properties: {
    rule_name: { type: "string" },
    simple_explanation: { type: "string" },
    detailed_explanation: { type: "string" },
    visual_representation: {
      type: "object",
      properties: {
        type: { type: "string" },
        description: { type: "string" },
        headers: {
          type: "array",
          items: { type: "string" }
        },
        rows: {
          type: "array",
          items: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      required: ["type", "description"]
    },
    comparison_with_english: { type: "string" },
    common_mistakes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          wrong: { type: "string" },
          right: { type: "string" },
          explanation: { type: "string" }
        },
        required: ["wrong", "right", "explanation"]
      }
    },
    practice_sentences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          albanian: { type: "string" },
          english: { type: "string" },
          grammar_highlight: { type: "string" }
        },
        required: ["albanian", "english", "grammar_highlight"]
      }
    }
  },
  required: ["rule_name", "simple_explanation", "detailed_explanation", "comparison_with_english", "common_mistakes", "practice_sentences"],
  additionalProperties: false
};

const conjugationTableSchema = {
  type: "object",
  properties: {
    verb: { type: "string" },
    tense: { type: "string" },
    type: { type: "string", enum: ["regular", "irregular"] },
    conjugations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          person: { type: "string" },
          albanian: { type: "string" },
          pronunciation: { type: "string" },
          english: { type: "string" },
          literal: { type: "string" }
        },
        required: ["person", "albanian", "pronunciation", "english"]
      }
    },
    pattern_notes: { type: "string" },
    usage_notes: { type: "string" }
  },
  required: ["verb", "tense", "type", "conjugations", "pattern_notes", "usage_notes"],
  additionalProperties: false
};

const patternRecognitionSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    patterns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pattern_name: { type: "string" },
          explanation: { type: "string" },
          visual: { type: "string" },
          practice_tip: { type: "string" },
          examples: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["pattern_name", "explanation", "visual", "practice_tip", "examples"]
      }
    },
    pattern_exercises: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          instruction: { type: "string" },
          examples: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["type", "instruction", "examples"]
      }
    }
  },
  required: ["title", "patterns", "pattern_exercises"],
  additionalProperties: false
};

const culturalNotesSchema = {
  type: "object",
  properties: {
    notes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          content: { type: "string" }
        },
        required: ["topic", "content"]
      },
      minItems: 2,
      maxItems: 3
    }
  },
  required: ["notes"],
  additionalProperties: false
};

const lessonSummarySchema = {
  type: "object",
  properties: {
    key_points: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5
    },
    quick_reference: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: { type: "string" }
      }
    },
    self_assessment: {
      type: "array",
      items: { type: "string" }
    },
    next_lesson_preview: { type: "string" }
  },
  required: ["key_points", "quick_reference", "self_assessment", "next_lesson_preview"],
  additionalProperties: false
};

module.exports = {
  vocabularySchema,
  lessonOverviewSchema,
  lessonIntroductionSchema,
  grammarExplanationSchema,
  conjugationTableSchema,
  patternRecognitionSchema,
  culturalNotesSchema,
  lessonSummarySchema
};