from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List


@dataclass(frozen=True)
class Concept:
    name: str
    definition: str
    tool: str
    output: str
    starter: str
    scenario: str
    prerequisite: str
    pitfall: str
    best_practice: str
    advanced_focus: str


def alt_values(concepts: List[Concept], current_index: int, field: str, limit: int) -> List[str]:
    values: List[str] = []
    for offset in range(1, len(concepts) + 1):
        candidate = getattr(concepts[(current_index + offset) % len(concepts)], field)
        if candidate != getattr(concepts[current_index], field) and candidate not in values:
            values.append(candidate)
        if len(values) == limit:
            break
    return values


def concept_names(concepts: List[Concept], current_index: int, limit: int) -> List[str]:
    names: List[str] = []
    for offset in range(1, len(concepts) + 1):
        candidate = concepts[(current_index + offset) % len(concepts)].name
        if candidate not in names:
            names.append(candidate)
        if len(names) == limit:
            break
    return names


def option_block(correct: str, distractors: List[str]) -> List[str]:
    options = [correct]
    for distractor in distractors:
        if distractor != correct and distractor not in options:
            options.append(distractor)
        if len(options) == 4:
            break
    return options


def build_questions(skill_id: str, skill_title: str, concepts: List[Concept]) -> List[Dict[str, object]]:
    questions: List[Dict[str, object]] = []
    for index, concept in enumerate(concepts):
        question_id_prefix = f"{skill_id}-{index + 1:02d}"

        definition_options = option_block(concept.definition, alt_values(concepts, index, "definition", 3))
        tool_options = option_block(concept.tool, alt_values(concepts, index, "tool", 3))
        output_options = option_block(concept.output, alt_values(concepts, index, "output", 3))
        starter_options = option_block(concept.starter, alt_values(concepts, index, "starter", 3))
        name_options = option_block(concept.name, concept_names(concepts, index, 3))
        best_practice_options = option_block(concept.best_practice, alt_values(concepts, index, "best_practice", 3))
        advanced_focus_options = option_block(concept.advanced_focus, alt_values(concepts, index, "advanced_focus", 3))

        questions.extend(
            [
                {
                    "id": f"{question_id_prefix}-q1",
                    "difficulty": "easy",
                    "type": "mcq",
                    "question": f"In {skill_title}, what best describes {concept.name}?",
                    "options": definition_options,
                    "answer": concept.definition,
                    "explanation": f"{concept.name} is best understood as: {concept.definition}",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "definition"],
                },
                {
                    "id": f"{question_id_prefix}-q2",
                    "difficulty": "easy",
                    "type": "mcq",
                    "question": f"Which tool, service, or artifact is most associated with {concept.name}?",
                    "options": tool_options,
                    "answer": concept.tool,
                    "explanation": f"{concept.name} is commonly practiced with {concept.tool}.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "tooling"],
                },
                {
                    "id": f"{question_id_prefix}-q3",
                    "difficulty": "easy",
                    "type": "mcq",
                    "question": f"What is a likely output or result when someone practices {concept.name} well?",
                    "options": output_options,
                    "answer": concept.output,
                    "explanation": f"A strong result of {concept.name} is {concept.output}.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "outcomes"],
                },
                {
                    "id": f"{question_id_prefix}-q4",
                    "difficulty": "medium",
                    "type": "mcq",
                    "question": f"A learner wants to build confidence in {concept.name}. What is the best starting activity?",
                    "options": starter_options,
                    "answer": concept.starter,
                    "explanation": f"{concept.starter} creates the right entry point before going deeper into {concept.name}.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "practice"],
                },
                {
                    "id": f"{question_id_prefix}-q5",
                    "difficulty": "medium",
                    "type": "mcq",
                    "question": f"Which concept best fits this goal: {concept.scenario}?",
                    "options": name_options,
                    "answer": concept.name,
                    "explanation": f"The scenario points to {concept.name} because that concept directly supports the goal described.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "scenario"],
                },
                {
                    "id": f"{question_id_prefix}-q6",
                    "difficulty": "medium",
                    "type": "mcq",
                    "question": f"A team jumped into {concept.name} without being comfortable with {concept.prerequisite}. What is the most likely issue?",
                    "options": [
                        f"They will struggle to reason about {concept.name} decisions consistently.",
                        "Their work will automatically become more secure by default.",
                        "They will remove the need for testing entirely.",
                        "They will no longer need stakeholder feedback.",
                    ],
                    "answer": f"They will struggle to reason about {concept.name} decisions consistently.",
                    "explanation": f"{concept.prerequisite} supports the mental model needed to apply {concept.name} well.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "prerequisites"],
                },
                {
                    "id": f"{question_id_prefix}-q7",
                    "difficulty": "medium",
                    "type": "mcq",
                    "question": f"Which action best avoids this common mistake in {concept.name}: {concept.pitfall}?",
                    "options": best_practice_options,
                    "answer": concept.best_practice,
                    "explanation": f"{concept.best_practice} directly reduces the risk caused by {concept.pitfall}.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "pitfalls"],
                },
                {
                    "id": f"{question_id_prefix}-q8",
                    "difficulty": "hard",
                    "type": "mcq",
                    "question": f"A project using {concept.name} produced weak results because the team repeated this mistake: {concept.pitfall}. What improvement should they prioritize first?",
                    "options": best_practice_options,
                    "answer": concept.best_practice,
                    "explanation": f"The fastest way to recover from that failure mode is to {concept.best_practice.lower()}.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "diagnosis"],
                },
                {
                    "id": f"{question_id_prefix}-q9",
                    "difficulty": "hard",
                    "type": "mcq",
                    "question": f"When a learner is already comfortable with the basics of {concept.name}, what advanced area should they focus on next?",
                    "options": advanced_focus_options,
                    "answer": concept.advanced_focus,
                    "explanation": f"{concept.advanced_focus} is the natural next stretch area after the fundamentals of {concept.name}.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "advanced"],
                },
                {
                    "id": f"{question_id_prefix}-q10",
                    "difficulty": "hard",
                    "type": "mcq",
                    "question": f"You are mentoring someone who already understands {concept.name}. Which follow-up objective would create the strongest portfolio signal?",
                    "options": advanced_focus_options,
                    "answer": concept.advanced_focus,
                    "explanation": f"For portfolio depth, {concept.advanced_focus.lower()} shows that the learner can move beyond surface-level use of {concept.name}.",
                    "tags": [skill_id, concept.name.lower().replace(' ', "_"), "portfolio"],
                },
            ]
        )

    return questions


SKILLS: List[Dict[str, object]] = [
    {
        "id": "python_programming",
        "continent": "AI & Data",
        "title": "Python Programming",
        "concepts": [
            Concept("Python Syntax", "Reading and writing valid Python statements, expressions, and control flow.", "A simple Python REPL session", "Clean scripts that run without syntax errors", "Write short scripts with variables, loops, and conditionals.", "Write small automation scripts that transform raw text files", "Basic programming logic", "Memorizing syntax without tracing what the program actually does", "Trace sample inputs and outputs before expanding the script", "Refactor multi-step scripts into readable modules"),
            Concept("Data Structures", "Using lists, tuples, sets, and dictionaries to organize data effectively.", "A dictionary-based lookup table", "A data model that supports fast lookups and iteration", "Practice choosing between list, set, tuple, and dictionary for toy datasets.", "Organize student skill scores so they can be searched and updated easily", "Python Syntax", "Using one container type for every situation", "Map the access pattern before choosing the structure", "Analyze time and space trade-offs of different containers"),
            Concept("Functions", "Packaging reusable logic into named blocks with parameters and return values.", "A utility module with helper functions", "Reusable code with clearer interfaces", "Break one long script into smaller reusable functions.", "Turn repeated grading logic into one reusable scoring function", "Data Structures", "Creating giant functions that do too many unrelated things", "Give each function one clear responsibility and return useful values", "Design functions with validation, testing, and composition in mind"),
            Concept("Object-Oriented Programming", "Modeling behavior and state with classes and objects.", "A class that represents a learner profile", "Code that groups data and behavior together", "Build a small class with attributes and methods.", "Represent courses, learners, and progress as objects inside one app", "Functions", "Using classes when simple functions and dictionaries would be clearer", "Choose classes only when shared state and behavior really matter", "Design maintainable class hierarchies and composition patterns"),
            Concept("File Handling", "Reading from and writing to files safely and predictably.", "A CSV import script", "Persistent data stored and retrieved from local files", "Read and write text and CSV files with context managers.", "Load quiz data from disk and export learner progress reports", "Functions", "Forgetting to close files or validate file contents", "Use context managers and verify the data you read", "Build robust data pipelines with error handling and batch processing"),
            Concept("Virtual Environments", "Isolating project dependencies so packages do not conflict across projects.", "A local .venv folder", "A project with reproducible package versions", "Create a virtual environment and install one package into it.", "Set up separate Python dependencies for a web app and an ML notebook", "File Handling", "Installing packages globally and breaking another project", "Create per-project environments and pin dependency versions", "Manage dependency locking and environment reproducibility for teams"),
            Concept("Testing", "Checking code behavior with automated test cases.", "A pytest test suite", "Confidence that code changes did not break expected behavior", "Write a few unit tests for helper functions.", "Verify that score calculation logic works for edge cases", "Functions", "Only testing the happy path", "Add edge cases, failure cases, and regression tests", "Design testable modules and layered test strategies"),
            Concept("APIs", "Connecting software systems through structured requests and responses.", "A REST API request with JSON", "Data fetched from or sent to another application", "Send simple GET and POST requests and inspect the response.", "Pull job listings from an external service into the platform", "File Handling", "Ignoring authentication, error codes, or rate limits", "Handle request failures and validate response payloads", "Design resilient integrations with retries, pagination, and auth handling"),
            Concept("Pandas", "Using tabular data operations to clean, filter, and analyze datasets.", "A pandas DataFrame workflow", "Transformed tables ready for analysis or reporting", "Load a CSV into a DataFrame and practice filtering columns.", "Clean learner event logs and summarize completion patterns", "Data Structures", "Chaining too many operations without checking intermediate results", "Inspect intermediate tables and keep transformations readable", "Optimize data pipelines and communicate assumptions in analysis notebooks"),
            Concept("Debugging", "Finding, isolating, and fixing defects in code systematically.", "Breakpoints and stack traces", "Resolved bugs with a clearer understanding of the failure", "Reproduce a bug and inspect variables step by step.", "Fix a broken unlock rule that marks incomplete nodes as finished", "Testing", "Guessing at fixes without reproducing the issue", "Reproduce, inspect, and change one thing at a time", "Debug production-style issues using logs, tests, and instrumentation"),
        ],
    },
    {
        "id": "mathematics_statistics",
        "continent": "AI & Data",
        "title": "Mathematics & Statistics",
        "concepts": [
            Concept("Algebra", "Manipulating equations and expressions to solve for unknown values.", "Solving equations for a model feature", "Variables isolated so relationships are easier to analyze", "Practice rearranging formulas and solving linear equations.", "Solve for missing values in a scoring formula", "Arithmetic fundamentals", "Memorizing formulas without understanding what each term means", "Label each variable and interpret the equation before solving", "Generalize algebraic reasoning to multivariable modeling"),
            Concept("Linear Algebra", "Working with vectors, matrices, and transformations used in ML systems.", "Matrix multiplication", "Structured numerical representations for features and transformations", "Compute simple vector and matrix operations by hand.", "Understand how feature matrices feed a machine learning model", "Algebra", "Treating matrix shapes as an afterthought", "Check dimensions before performing operations", "Apply matrix thinking to embeddings and optimization"),
            Concept("Calculus", "Studying change, gradients, and accumulation to reason about optimization.", "A derivative-based optimization sketch", "Rates of change that explain how one value responds to another", "Plot functions and estimate slopes at different points.", "Reason about how a loss function changes during training", "Algebra", "Applying formulas mechanically without understanding change", "Connect derivatives to movement, slope, and optimization", "Use gradient intuition for training dynamics and tuning"),
            Concept("Probability", "Measuring uncertainty and the likelihood of events.", "A probability tree", "Likelihood estimates for events and outcomes", "Solve simple probability questions with coins, dice, and events.", "Estimate the chance that a model prediction is correct", "Algebra", "Confusing independent and dependent events", "State the event assumptions clearly before calculating", "Use conditional probability to reason about real-world decisions"),
            Concept("Descriptive Statistics", "Summarizing datasets with central tendency and spread.", "Mean, median, and standard deviation tables", "A compact numerical summary of a dataset", "Compare small datasets using mean, median, range, and variance.", "Summarize learner performance from assessment results", "Algebra", "Using averages without checking outliers or skew", "Pair central tendency with spread and distribution shape", "Use summary statistics to critique data quality"),
            Concept("Distributions", "Understanding how values are spread across possible outcomes.", "A histogram of sampled values", "A clearer picture of normal, skewed, or heavy-tailed behavior", "Visualize and compare common statistical distributions.", "Recognize whether quiz scores are balanced or skewed", "Descriptive Statistics", "Assuming every dataset follows a normal distribution", "Inspect the actual shape before choosing methods", "Select modeling assumptions based on distribution behavior"),
            Concept("Inferential Statistics", "Using sample data to make judgments about a larger population.", "Confidence interval estimates", "Evidence-based conclusions beyond the observed sample", "Interpret confidence intervals and sampling variation in examples.", "Decide whether pilot learner data supports scaling a new feature", "Probability", "Treating one sample as if it represents the full population perfectly", "Account for uncertainty and sampling limitations", "Evaluate studies by sample size, variance, and effect size"),
            Concept("Hypothesis Testing", "Testing whether observed differences are likely due to chance.", "A p-value based decision workflow", "A decision about whether evidence supports a claim", "Set up null and alternative hypotheses for small experiments.", "Check whether a new practice game improved quiz performance", "Inferential Statistics", "Confusing statistical significance with practical importance", "Interpret p-values together with effect size and context", "Choose appropriate tests and communicate result limitations"),
            Concept("Optimization", "Finding parameter values that improve an objective function.", "A loss-minimization routine", "Better solutions found by iteratively improving a target metric", "Practice maximizing or minimizing simple functions.", "Tune a recommendation rule to improve readiness predictions", "Calculus", "Changing many variables without a clear objective", "Define the objective and constraints before tuning", "Balance convergence speed, stability, and constraints"),
            Concept("Bayesian Thinking", "Updating beliefs as new evidence becomes available.", "A prior and posterior probability example", "Revised beliefs that reflect newly observed information", "Work through small prior-to-posterior update examples.", "Update confidence in a learner's readiness after new assessments", "Probability", "Treating priors as bias instead of explicit assumptions", "State your prior belief and show how evidence changes it", "Apply Bayesian reasoning to decision systems under uncertainty"),
        ],
    },
    {
        "id": "machine_learning",
        "continent": "AI & Data",
        "title": "Machine Learning",
        "concepts": [
            Concept("Data Preprocessing", "Cleaning and preparing raw data before model training.", "A preprocessing pipeline", "A dataset that is consistent, usable, and model-ready", "Handle missing values and normalize a simple dataset.", "Prepare learner activity logs before training a readiness model", "Python Programming", "Feeding messy raw data directly into a model", "Create repeatable preprocessing steps before training", "Build production-safe preprocessing with leakage checks"),
            Concept("Feature Engineering", "Creating informative inputs that help models learn better patterns.", "Engineered feature columns", "Richer signals that improve model performance", "Transform raw fields into more meaningful numeric features.", "Convert raw time-on-task events into trend features", "Data Preprocessing", "Adding many features without checking relevance", "Create features tied to a clear hypothesis and validate them", "Measure feature impact and control complexity"),
            Concept("Supervised Learning", "Training models with labeled examples to predict known targets.", "A labeled training dataset", "Predictions for a known outcome like class or value", "Train a small model with labeled examples.", "Predict whether a learner will complete a state on time", "Probability", "Using mislabeled or weak labels as if they are perfect truth", "Inspect label quality before trusting the model", "Design supervised workflows with realistic target definitions"),
            Concept("Regression", "Predicting a continuous numeric value from input features.", "A regression model", "Numeric predictions such as score, time, or cost", "Fit a model that predicts a numeric target.", "Estimate the number of hours a learner may need to finish a skill cluster", "Supervised Learning", "Evaluating regression with classification metrics", "Match the metric to the prediction type", "Compare linear and nonlinear regression trade-offs"),
            Concept("Classification", "Predicting which category an example belongs to.", "A classifier with class labels", "Predicted categories such as pass or fail", "Train a model that separates two or more classes.", "Predict whether a learner is beginner, intermediate, or advanced", "Supervised Learning", "Ignoring class imbalance during training and evaluation", "Check class balance and adjust the training strategy", "Tune thresholds and class trade-offs for real decisions"),
            Concept("Cross-Validation", "Testing models across multiple data splits to estimate generalization.", "K-fold validation results", "A more reliable estimate of how the model performs on unseen data", "Run a simple train-validation split and compare it to k-fold validation.", "Check whether a readiness model is stable across different learner groups", "Model Evaluation", "Trusting one lucky split as the final answer", "Use repeated or k-fold validation to reduce split bias", "Design robust validation for time-based or grouped data"),
            Concept("Clustering", "Grouping similar examples without predefined labels.", "Cluster assignments", "Segments that reveal natural structure in data", "Apply clustering to small unlabeled datasets.", "Group learners by engagement pattern without labeled outcomes", "Data Preprocessing", "Assuming clusters are meaningful without validating them", "Inspect cluster quality and business usefulness before acting", "Compare clustering methods and distance assumptions"),
            Concept("Dimensionality Reduction", "Compressing features while keeping useful structure.", "A lower-dimensional embedding", "Simpler feature spaces for visualization or modeling", "Reduce a toy dataset to fewer dimensions and visualize it.", "Visualize complex learner embeddings on a two-dimensional map", "Linear Algebra", "Dropping dimensions blindly and losing important signal", "Check retained variance or task impact after reduction", "Use embeddings strategically for search and recommendations"),
            Concept("Ensemble Methods", "Combining multiple models to improve predictive performance.", "A random forest or boosting pipeline", "Stronger predictions from multiple learners working together", "Compare one model to an ensemble on the same dataset.", "Improve readiness predictions by combining several weak learners", "Classification", "Assuming more models always means better performance", "Balance accuracy gains against complexity and interpretability", "Choose ensemble strategies based on data size and deployment cost"),
            Concept("Model Evaluation", "Measuring model quality with metrics tied to the task and risk.", "A metric report with error or classification scores", "Evidence showing whether a model is useful for the problem", "Compare metrics such as accuracy, precision, recall, and RMSE.", "Judge whether a recommendation model is ready to ship", "Supervised Learning", "Optimizing a metric that does not match the real-world goal", "Select metrics that reflect the real decision and user impact", "Design evaluation plans that include fairness, drift, and business impact"),
        ],
    },
    {
        "id": "deep_learning",
        "continent": "AI & Data",
        "title": "Deep Learning",
        "concepts": [
            Concept("Tensors", "Representing data as multi-dimensional arrays for neural network computation.", "Tensor operations in a deep learning library", "Structured numeric inputs ready for model computation", "Create and inspect vectors, matrices, and higher-order tensors.", "Prepare image or sequence data for a neural network", "Linear Algebra", "Ignoring tensor shapes until runtime errors appear", "Track dimensions carefully at each transformation step", "Reason about memory layout and batching efficiency"),
            Concept("Neural Networks", "Stacking layers of learned transformations to model complex patterns.", "A feedforward network architecture", "Predictions generated by layered nonlinear computation", "Train a small dense network on a toy dataset.", "Model nonlinear learner performance patterns from multiple signals", "Machine Learning", "Adding layers without understanding whether the data supports them", "Start simple and increase complexity only when justified", "Match architecture depth to data scale and task complexity"),
            Concept("Activation Functions", "Adding nonlinearity so neural networks can learn richer mappings.", "ReLU or GELU activations", "Networks that can model nonlinear relationships", "Compare outputs from common activation functions.", "Understand why a deep model can learn beyond linear boundaries", "Neural Networks", "Using activations without checking gradient behavior", "Choose activations that support stable optimization", "Evaluate activation choices based on task behavior and training stability"),
            Concept("Backpropagation", "Computing gradients so the model can update weights efficiently.", "Automatic differentiation", "Weight updates guided by loss gradients", "Trace a tiny network and observe how gradients flow backward.", "Explain how the model learns from prediction errors", "Calculus", "Treating gradient flow as a black box and missing training problems", "Inspect losses and gradients when training behaves strangely", "Diagnose vanishing, exploding, or blocked gradients"),
            Concept("Optimization in Deep Learning", "Using optimizers to adjust weights and reduce loss over time.", "Adam or SGD optimizer settings", "A training process that converges toward better performance", "Experiment with learning rates and optimizer settings.", "Tune training so a model improves steadily instead of diverging", "Backpropagation", "Changing optimizer settings randomly without reading the loss curve", "Use the training curve to guide optimizer adjustments", "Balance learning rate, schedule, and generalization"),
            Concept("Regularization", "Reducing overfitting so models generalize better to unseen data.", "Dropout or weight decay", "A model that performs more consistently on validation data", "Compare training and validation behavior with and without regularization.", "Stop a learner-readiness model from memorizing noisy signals", "Optimization in Deep Learning", "Chasing training accuracy while ignoring validation performance", "Monitor validation metrics and add regularization intentionally", "Combine multiple regularization techniques without hurting capacity"),
            Concept("Convolutional Neural Networks", "Using convolutional layers to capture spatial patterns in images.", "A CNN image pipeline", "Feature maps that detect local visual structure", "Train a small CNN on simple image data.", "Classify screenshot-based activity patterns or visual badges", "Tensors", "Flattening image structure too early and losing spatial information", "Preserve spatial locality when the task depends on image patterns", "Adapt CNN design to transfer learning and efficiency constraints"),
            Concept("Sequence Models", "Modeling ordered data such as text, logs, or time series.", "A transformer or recurrent architecture", "Predictions that depend on order and context", "Explore how token or time order changes model behavior.", "Analyze learning event sequences to predict dropout risk", "Tensors", "Treating ordered events as if they were independent rows", "Preserve sequence order and context during modeling", "Compare recurrent and attention-based sequence strategies"),
            Concept("Transfer Learning", "Starting from a pretrained model and adapting it to a new task.", "A pretrained backbone with a fine-tuning head", "Faster learning with less labeled data", "Fine-tune a pretrained model on a small dataset.", "Adapt an existing model for certification scoring with limited labels", "Neural Networks", "Fine-tuning everything at once without checking data size or stability", "Freeze, probe, and then fine-tune with care", "Choose adaptation depth and evaluation strategy for limited data"),
            Concept("Inference and Deployment", "Serving trained models so users can receive predictions reliably.", "A model inference endpoint", "Predictions delivered in an application workflow", "Package a trained model and test prediction latency.", "Serve readiness predictions inside the career exploration platform", "Testing", "Optimizing offline accuracy without checking latency or monitoring", "Test the full inference path, not just the notebook result", "Design model serving for latency, scaling, and drift monitoring"),
        ],
    },
    {
        "id": "data_visualization",
        "continent": "AI & Data",
        "title": "Data Visualization",
        "concepts": [
            Concept("Chart Selection", "Choosing visuals that match the question and data type.", "A chart type decision table", "A graphic that answers the intended question clearly", "Match common analytics questions to chart types.", "Choose how to show learner progress, comparison, and trend data", "Descriptive Statistics", "Using flashy charts that hide the core message", "Choose the simplest chart that supports the decision", "Justify visualization choices based on audience and task"),
            Concept("Exploratory Visualization", "Using quick visuals to inspect patterns, outliers, and relationships.", "A histogram or scatter plot notebook", "Early insight into the shape and quality of a dataset", "Create quick plots to inspect raw data before formal reporting.", "Spot unusual learner drop-off points before building a dashboard", "Chart Selection", "Jumping to final dashboards before exploring the data", "Use quick exploratory plots before final storytelling", "Turn exploratory findings into defensible narratives"),
            Concept("Matplotlib Basics", "Building foundational static charts in Python.", "A matplotlib plotting script", "Custom static plots for analysis and reports", "Create line, bar, and scatter plots from a small dataset.", "Generate a basic readiness progress report for one cohort", "Python Programming", "Writing plots without labeling axes or titles", "Always label the chart so viewers understand the message", "Control styling and composition for multi-plot analytical reports"),
            Concept("Seaborn and Statistical Plots", "Creating higher-level charts that reveal distributions and relationships.", "A seaborn boxplot or heatmap", "Visual summaries of correlation, spread, and category patterns", "Compare categories and distributions with seaborn charts.", "Visualize score distributions across beginner, intermediate, and advanced learners", "Matplotlib Basics", "Using default plots without checking whether they answer the question", "Choose the plot based on the comparison or distribution you need to show", "Combine statistical plots with domain context and annotation"),
            Concept("Dashboard Design", "Arranging visuals and KPIs so users can monitor progress efficiently.", "A dashboard wireframe", "A clear overview of performance, trends, and alerts", "Sketch a simple dashboard with a few key metrics.", "Design a learner progress dashboard for mentors and students", "Chart Selection", "Packing too many widgets into one screen", "Limit each view to the decisions the user needs to make", "Balance overview metrics with drill-down workflows"),
            Concept("Data Storytelling", "Connecting visuals into a narrative that supports action.", "A slide or dashboard narrative flow", "A message that explains what happened, why it matters, and what to do next", "Turn three charts into a short narrative summary.", "Explain why learners stall after a specific module and what to change", "Exploratory Visualization", "Showing charts without a takeaway or recommended action", "Add context, conclusion, and next step to every key visual", "Tailor narrative framing to technical and non-technical audiences"),
            Concept("Color and Emphasis", "Using color intentionally to guide attention without confusion.", "A restrained color palette", "Visual emphasis that highlights what matters most", "Highlight one important signal with minimal color use.", "Draw attention to at-risk learners without overwhelming the dashboard", "Chart Selection", "Using too many competing highlight colors", "Reserve strong color for the most important contrast", "Build semantic color systems for status and comparison"),
            Concept("Accessibility in Visualization", "Making charts understandable for varied audiences and abilities.", "Accessible labels and contrast checks", "Visuals that remain usable across devices and viewer needs", "Check chart color contrast and add direct labels.", "Ensure progress charts work for color-blind users", "Color and Emphasis", "Relying only on color to communicate meaning", "Use labels, contrast, and patterns together when needed", "Audit visualizations for accessibility and inclusive interpretation"),
            Concept("Interactive Visualization", "Letting users filter, hover, and drill into visual data.", "A filterable dashboard component", "A visualization that supports exploration and personalized analysis", "Add simple filters to a chart or dashboard mockup.", "Let users inspect readiness by role, state, and difficulty level", "Dashboard Design", "Adding interaction that makes the main insight harder to find", "Use interaction to deepen understanding, not hide basics", "Design interaction flows that preserve clarity under complexity"),
            Concept("KPI Tracking", "Defining and visualizing performance indicators tied to outcomes.", "A KPI scorecard", "Metrics that can be tracked consistently over time", "Define a small set of KPIs and map each to a visualization.", "Track completion rate, quiz success, and readiness change over time", "Data Storytelling", "Tracking many metrics without linking them to decisions", "Pick KPIs that directly connect to goals and actions", "Review whether KPIs still reflect real product outcomes"),
        ],
    },
    {
        "id": "cloud_platforms",
        "continent": "Cloud & Infrastructure",
        "title": "Cloud Platforms",
        "concepts": [
            Concept("Identity and Access Management", "Controlling who can access which cloud resources and actions.", "IAM roles and policies", "Safer access boundaries for teams and services", "Create users, roles, and least-privilege policies in a sandbox.", "Give an app permission to read storage without exposing admin rights", "Security basics", "Granting broad admin access because it is faster in the short term", "Use least privilege and role-based access from the start", "Audit and refine access boundaries across environments"),
            Concept("Compute Services", "Running applications on virtual machines, containers, or managed runtimes.", "A virtual machine or managed app service", "Application workloads deployed and reachable in the cloud", "Launch a simple application on a small compute service.", "Host the learning platform backend on a cloud runtime", "Identity and Access Management", "Choosing compute before understanding workload needs", "Match the service model to workload control, scale, and ops needs", "Compare managed, serverless, and self-managed compute trade-offs"),
            Concept("Storage Services", "Persisting files, objects, and block data in cloud systems.", "Object storage buckets", "Durable data storage for assets, logs, and backups", "Upload, organize, and retrieve files from object storage.", "Store certificates, media assets, and exported reports", "Compute Services", "Treating all storage types as interchangeable", "Choose storage based on access pattern, latency, and durability needs", "Design lifecycle, versioning, and cost-aware storage strategies"),
            Concept("Managed Databases", "Using hosted database services for relational or NoSQL workloads.", "A managed SQL instance", "Reliable data persistence with less operational overhead", "Provision a small managed database and connect an app to it.", "Store user profiles, progress, and assessment attempts", "Storage Services", "Ignoring backups, indexing, or connection limits", "Plan data models, performance, and backup strategy early", "Choose between relational, document, and key-value services intentionally"),
            Concept("Virtual Networking", "Designing private networks, subnets, and controlled traffic paths in the cloud.", "A VPC or virtual network", "Isolated network segments and controlled communication", "Create subnets and basic inbound and outbound rules.", "Separate public app traffic from private database traffic", "Networking Fundamentals", "Opening network access broadly to solve a short-term connectivity issue", "Segment networks and expose only the paths you need", "Design hybrid and multi-tier network layouts"),
            Concept("Serverless Services", "Running code in managed execution environments without managing servers directly.", "A serverless function", "Event-driven features that scale automatically for bursts", "Deploy a simple event-driven function.", "Generate and email certificates when learners finish a state", "Compute Services", "Assuming serverless removes all architecture constraints", "Account for cold starts, time limits, and event design", "Use event-driven architecture to balance speed and maintainability"),
            Concept("Monitoring and Observability", "Tracking health, logs, metrics, and traces across cloud systems.", "Cloud monitoring dashboards and logs", "Operational visibility into system behavior", "Send logs and metrics from a small demo service.", "Detect whether readiness recommendations are failing after deployment", "Compute Services", "Waiting for user complaints instead of watching service signals", "Define metrics, alerts, and logs before incidents happen", "Correlate logs, metrics, and traces across services"),
            Concept("Cost Optimization", "Managing cloud spend by aligning architecture with actual usage.", "Cloud cost reports and budgets", "Lower waste with better-sizing and lifecycle control", "Review a small architecture and identify obvious waste.", "Reduce spending on idle learning environments and oversized databases", "Monitoring and Observability", "Scaling resources up and forgetting to revisit usage later", "Review utilization regularly and remove waste proactively", "Make cost a design constraint alongside reliability and speed"),
            Concept("Infrastructure as Code", "Defining cloud resources in version-controlled configuration.", "Terraform or cloud-native templates", "Repeatable environments that can be reviewed and recreated", "Create a small environment using infrastructure code.", "Provision app, storage, and monitoring consistently across stages", "Compute Services", "Clicking resources manually and losing track of environment drift", "Capture infrastructure changes in version control", "Design reusable modules and safe deployment workflows"),
            Concept("Shared Responsibility Model", "Understanding which security and operations duties belong to the provider versus the customer.", "Cloud responsibility documentation", "Clear ownership boundaries for security and operations tasks", "Map a few example responsibilities between provider and customer.", "Decide who handles patching, encryption, and data governance in your stack", "Identity and Access Management", "Assuming the provider secures every layer automatically", "List customer-owned controls explicitly for each service", "Use service models to reason about shifting responsibility boundaries"),
        ],
    },
    {
        "id": "networking_fundamentals",
        "continent": "Cloud & Infrastructure",
        "title": "Networking Fundamentals",
        "concepts": [
            Concept("IP Addressing", "Assigning unique network identifiers so devices can communicate.", "IPv4 and subnet examples", "Devices that can route traffic to the correct destination", "Practice reading addresses, CIDR ranges, and subnet masks.", "Plan address ranges for app servers and databases", "Binary basics", "Treating private and public IPs as interchangeable", "Map address ranges to the exposure each system actually needs", "Design address allocation that supports growth and segmentation"),
            Concept("DNS", "Translating human-friendly names into IP addresses for networked services.", "A DNS record set", "Traffic routed to the right service by name", "Create and inspect A, CNAME, and related records in examples.", "Point the platform domain to the deployed frontend service", "IP Addressing", "Ignoring DNS caching and propagation behavior", "Plan for propagation delays and verify records carefully", "Use DNS strategically for failover and traffic steering"),
            Concept("HTTP and HTTPS", "Using web protocols to request and deliver application resources.", "HTTP methods and TLS-enabled endpoints", "Web requests that move data between clients and servers securely", "Inspect request methods, headers, and responses in a browser or tool.", "Send quiz results from the frontend to the backend API", "DNS", "Treating HTTPS as optional for user and auth data", "Use TLS everywhere that handles user traffic or credentials", "Reason about protocol behavior, caching, and transport security"),
            Concept("Routing", "Choosing network paths so packets reach the correct destination.", "Route tables", "Traffic forwarded along defined paths between networks", "Trace simple packet paths across subnets and gateways.", "Allow private services to reach public package mirrors through a gateway", "IP Addressing", "Adding routes without understanding where they point", "Verify route targets and network boundaries before changes", "Design multi-network routing for reliability and isolation"),
            Concept("Firewalls and Security Groups", "Filtering traffic based on rules that allow or deny communication.", "Inbound and outbound rule sets", "Controlled network exposure for applications and services", "Write allow-list rules for a small app architecture.", "Allow web traffic to the app while blocking direct database access", "HTTP and HTTPS", "Opening wide ports to debug and forgetting to close them", "Start narrow and add only the traffic you can justify", "Layer network controls with identity and application security"),
            Concept("Load Balancing", "Distributing traffic across multiple service instances.", "A load balancer", "Better availability and smoother traffic handling", "Route requests across a few backend instances in a lab.", "Spread learner traffic across multiple API replicas", "Routing", "Using one server behind a balancer without health checks", "Combine balancing with health checks and redundancy", "Choose balancing strategies based on protocol and state behavior"),
            Concept("Latency and Throughput", "Measuring delay and capacity in network communication.", "Latency and bandwidth test results", "A clearer picture of responsiveness and transfer limits", "Compare how response time changes under different conditions.", "Explain why a recommendation page feels slow for distant users", "HTTP and HTTPS", "Optimizing bandwidth when latency is the real bottleneck", "Measure both delay and capacity before tuning", "Relate network metrics to user experience and architecture choices"),
            Concept("TLS and Certificates", "Encrypting traffic and verifying server identity.", "A TLS certificate", "Trusted encrypted sessions between clients and servers", "Inspect certificate chains and secure connection settings.", "Secure the platform domain and API endpoints", "HTTP and HTTPS", "Letting certificates expire because renewal was never automated", "Automate renewal and monitor certificate validity", "Design certificate handling for multi-service environments"),
            Concept("Monitoring Network Health", "Watching connectivity, packet loss, and service reachability.", "Ping, trace, and network dashboards", "Faster detection of network issues and degraded paths", "Use simple tools to inspect packet loss and route changes.", "Detect why remote learners cannot consistently load dashboards", "Latency and Throughput", "Treating intermittent connectivity as a frontend-only bug", "Monitor the network path as part of incident response", "Correlate app failures with network signals and dependency health"),
            Concept("Content Delivery", "Serving static assets closer to users through distributed caches.", "A content delivery network", "Faster asset delivery and lower origin load", "Cache static files through an edge distribution example.", "Speed up delivery of badges, images, and learning media worldwide", "DNS", "Pushing dynamic, uncached logic into the edge without a plan", "Cache the right content and define clear invalidation behavior", "Balance edge performance with data freshness and complexity"),
        ],
    },
    {
        "id": "containers_orchestration",
        "continent": "Cloud & Infrastructure",
        "title": "Containers & Orchestration",
        "concepts": [
            Concept("Linux Basics", "Using the command line, processes, and permissions that underpin containerized systems.", "A shell session with files and processes", "More confident navigation of container hosts and images", "Practice file, process, and permission commands on Linux.", "Inspect why an app process inside a container is failing to start", "Operating system basics", "Copying commands without understanding users, paths, or permissions", "Read the system state before changing it", "Diagnose resource, process, and permission issues under pressure"),
            Concept("Container Images", "Packaging application code and dependencies into portable artifacts.", "A built container image", "A consistent application package that runs the same way across environments", "Build a simple image from an application folder.", "Package the learning platform backend for deployment", "Linux Basics", "Bundling unnecessary files and secrets into the image", "Keep images minimal and exclude sensitive data", "Optimize image size, layering, and security posture"),
            Concept("Dockerfiles", "Defining repeatable image builds with ordered instructions.", "A Dockerfile", "A reproducible container build process", "Write a Dockerfile for a small service.", "Create a build for the app with pinned dependencies and a startup command", "Container Images", "Adding commands in a random order that slows builds and hides intent", "Structure Dockerfiles for readability, caching, and safety", "Use multi-stage builds and reproducible dependency steps"),
            Concept("Container Runtime", "Running, inspecting, and managing containers on a host.", "Docker container commands", "Applications executing inside isolated runtime environments", "Run a container locally and inspect logs and ports.", "Verify that the API works correctly before pushing to the cloud", "Dockerfiles", "Assuming a successful build guarantees a healthy runtime", "Test the running container and inspect behavior directly", "Trace runtime failures involving env vars, ports, and startup logic"),
            Concept("Volumes and Networking", "Connecting containers to persistent data and each other.", "Mounted volumes and bridge networks", "Containers that can persist files and communicate cleanly", "Mount data and connect two local containers together.", "Store generated certificates and connect the app to a database container", "Container Runtime", "Treating containers as fully stateless while expecting hidden local persistence", "Be explicit about what data persists and how services connect", "Design secure and portable runtime dependencies"),
            Concept("Container Registries", "Storing and distributing images for deployment workflows.", "A container registry repository", "Versioned images that can be pulled into multiple environments", "Tag and push an image to a registry.", "Publish deployable app images for staging and production", "Container Images", "Using unclear tags that make releases hard to trace", "Adopt tagging rules that link images to builds and releases", "Design promotion flows across dev, staging, and production"),
            Concept("Kubernetes Pods and Services", "Running containers in clusters and exposing them internally or externally.", "Pod and Service manifests", "Clustered workloads reachable through stable networking", "Deploy a simple pod and expose it with a service.", "Run the app on a cluster with a stable internal endpoint", "Container Runtime", "Treating pods like long-lived servers instead of replaceable units", "Design pods as disposable units behind stable services", "Reason about pod health, service discovery, and platform behavior"),
            Concept("Deployments and Rollouts", "Managing desired state and controlled updates for cluster workloads.", "A Deployment rollout", "Versioned application updates with rollback options", "Update a deployment and observe rollout status.", "Ship a new recommendation model without breaking active learners", "Kubernetes Pods and Services", "Changing workloads without watching rollout health", "Use rollout status, readiness, and rollback plans every time", "Design progressive delivery and safe release workflows"),
            Concept("Scaling Systems", "Adjusting capacity to match traffic and workload demand.", "Horizontal pod autoscaling", "More resilient performance under changing load", "Scale a service up and down based on simple demand signals.", "Handle certificate-generation spikes during completion events", "Monitoring and Observability", "Scaling only after systems are already failing", "Choose signals and thresholds before peak traffic arrives", "Balance autoscaling speed, stability, and cost"),
            Concept("Monitoring and Logging for Containers", "Collecting logs, metrics, and alerts from containerized workloads.", "Cluster logging and metrics dashboards", "Faster troubleshooting and operational visibility", "Inspect logs and metrics for a running containerized app.", "Find why some learners receive slow or failed responses after deployment", "Container Runtime", "Treating container restarts as harmless without investigating the cause", "Use logs and metrics to explain each restart or performance drop", "Correlate cluster health with application behavior during incidents"),
        ],
    },
    {
        "id": "ci_cd_pipelines",
        "continent": "Cloud & Infrastructure",
        "title": "CI/CD Pipelines",
        "concepts": [
            Concept("Version Control", "Tracking code changes so teams can collaborate safely over time.", "A Git repository", "A history of changes that supports reviews and recovery", "Commit, branch, and compare small code changes.", "Manage feature work for the skill platform without overwriting teammates", "Software basics", "Working on the main branch without checkpoints or reviews", "Use branches and reviewable commits for meaningful changes", "Design branch and merge strategies that fit team speed"),
            Concept("Build Automation", "Turning source code into runnable artifacts in a repeatable way.", "An automated build job", "Consistent packages, images, or bundles from source code", "Create a simple script that builds the application.", "Bundle frontend and backend changes the same way every time", "Version Control", "Depending on manual local steps that nobody else can reproduce", "Capture every build step in automation", "Optimize build speed, caching, and artifact consistency"),
            Concept("Automated Testing", "Running tests in the pipeline before code is promoted.", "A test stage in CI", "Early detection of regressions before deployment", "Add unit tests and run them automatically on each change.", "Stop broken unlock logic from reaching production", "Build Automation", "Treating flaky tests as acceptable background noise", "Fix or quarantine flaky tests so pipeline signals stay trustworthy", "Layer unit, integration, and smoke tests effectively"),
            Concept("Artifact Management", "Storing build outputs so they can be promoted and reused.", "A package or image repository", "Traceable deployable artifacts linked to pipeline runs", "Publish one build artifact and retrieve it later.", "Promote the same app image from staging to production", "Build Automation", "Rebuilding the same release differently in each environment", "Build once and promote the verified artifact", "Design provenance and traceability into release artifacts"),
            Concept("Pipeline Orchestration", "Defining stages, triggers, and dependencies in delivery workflows.", "A CI/CD workflow file", "A repeatable process from commit to deployment", "Create a workflow with build, test, and deploy stages.", "Run checks automatically when the team updates recommendation logic", "Automated Testing", "Creating one giant pipeline with no clear stage boundaries", "Separate validation, packaging, and deployment concerns", "Balance pipeline speed with governance and release confidence"),
            Concept("Environment Promotion", "Moving validated builds through dev, staging, and production safely.", "A staged deployment pipeline", "Controlled releases with increasing confidence at each step", "Promote a tested build from one environment to the next.", "Verify a new dashboard layout in staging before a full release", "Artifact Management", "Deploying directly to production because staging feels slow", "Use staged promotion to catch issues before broad impact", "Add approvals and checks where risk is highest"),
            Concept("Secrets Management", "Handling credentials and tokens without exposing them in code or logs.", "A secrets store or pipeline secret", "Safer automation without hard-coded sensitive values", "Inject one secret into a build or deploy job securely.", "Deploy the app without exposing API keys in the repository", "Security basics", "Putting credentials in source code or plaintext config files", "Store secrets in dedicated systems and restrict their visibility", "Rotate and audit secrets as part of delivery hygiene"),
            Concept("Infrastructure Deployment", "Applying environment changes through automated delivery steps.", "An infrastructure deployment job", "Consistent platform changes tied to code review and release flow", "Run one infrastructure change through the pipeline.", "Update cloud resources for a new analytics service safely", "Infrastructure as Code", "Changing infrastructure manually outside the release workflow", "Deploy infrastructure changes through reviewed automation", "Coordinate app and infrastructure rollout dependencies"),
            Concept("Rollback and Recovery", "Reversing or mitigating failed releases quickly.", "A rollback strategy", "Faster recovery when a change causes incidents", "Practice reverting to a known-good version in a safe environment.", "Restore service quickly after a broken recommendation deploy", "Environment Promotion", "Waiting for a perfect fix instead of restoring service first", "Recover service first, then investigate root cause", "Design fast rollback paths that preserve data safety"),
            Concept("Pipeline Observability", "Measuring pipeline health, duration, and failure patterns.", "Build dashboards and alerting", "Better visibility into delivery reliability and bottlenecks", "Review run history and identify a recurring failure pattern.", "Find why deployments slow down every Friday release window", "Monitoring and Observability", "Only looking at pipeline failures after teams complain", "Track pipeline metrics continuously and improve weak stages", "Use delivery data to improve speed without losing safety"),
        ],
    },
    {
        "id": "system_design",
        "continent": "Cloud & Infrastructure",
        "title": "System Design",
        "concepts": [
            Concept("Requirements Analysis", "Clarifying functional and non-functional needs before designing architecture.", "A system requirements document", "A design grounded in real goals and constraints", "List users, workloads, and success metrics for a system idea.", "Define what the platform must do for students, mentors, and admins", "Product basics", "Starting architecture discussions before the problem is clear", "Write down goals, scale, and constraints before selecting technology", "Turn vague goals into measurable architecture targets"),
            Concept("API Design", "Structuring service interfaces so systems can communicate cleanly.", "An API contract", "Endpoints that are easier to use, test, and evolve", "Sketch a few resource endpoints and request shapes.", "Design how the frontend fetches career maps and learner progress", "Requirements Analysis", "Making endpoints around database tables instead of user workflows", "Design APIs around tasks, resources, and versioning strategy", "Balance simplicity, flexibility, and backward compatibility"),
            Concept("Data Modeling", "Choosing how data is structured, related, and stored.", "An entity relationship model", "A schema that supports application workflows and reporting", "Map entities and relationships for a small product.", "Model users, roles, learning nodes, attempts, and certificates", "Requirements Analysis", "Optimizing for one screen while ignoring future queries and analytics", "Model around core workflows and expected access patterns", "Evaluate schema evolution, indexing, and reporting trade-offs"),
            Concept("Caching", "Storing reusable results closer to the consumer to reduce repeated work.", "A cache layer", "Lower latency and reduced backend load", "Cache one read-heavy endpoint and measure the improvement.", "Speed up repeated reads of the career map and public profile pages", "API Design", "Caching dynamic data without defining invalidation rules", "Cache only what you can invalidate or tolerate being stale", "Choose cache scope, freshness, and eviction strategy deliberately"),
            Concept("Asynchronous Processing", "Moving long-running work into background jobs and queues.", "A job queue", "Smoother user flows for tasks that do not need immediate completion", "Send one slow task to a background worker.", "Generate certificates and analytics reports without blocking the user", "API Design", "Keeping users waiting on work that could happen asynchronously", "Move slow or bursty work behind durable queues when appropriate", "Design retries, idempotency, and failure handling for background jobs"),
            Concept("Scalability", "Planning how the system will handle more users, data, and requests.", "A scale-out architecture sketch", "A design that can grow without collapsing under load", "Estimate where traffic or data growth will stress the system first.", "Prepare the platform for spikes during placement season", "Requirements Analysis", "Assuming the current architecture will scale naturally forever", "Find bottlenecks early and design growth paths intentionally", "Relate scaling choices to cost, complexity, and user impact"),
            Concept("Reliability and Resilience", "Keeping systems available and recoverable when parts fail.", "Redundancy and failure recovery patterns", "A platform that degrades gracefully instead of failing completely", "Map failure points and simple recovery plans.", "Keep learning progress safe even when one service goes down", "Scalability", "Assuming failures are rare enough not to plan for", "Expect failures and decide how the system should respond", "Design retries, failover, and graceful degradation with intent"),
            Concept("Consistency and Trade-offs", "Choosing how strongly data stays synchronized across the system.", "A consistency model discussion", "Clear decisions about freshness, latency, and correctness", "Compare a strongly consistent read to an eventually consistent one.", "Decide how fast public achievement pages should update after completion", "Data Modeling", "Chasing perfect consistency everywhere regardless of cost", "Match consistency guarantees to the user expectation and risk", "Explain distributed trade-offs clearly to product stakeholders"),
            Concept("Observability", "Designing logs, metrics, and traces so behavior can be understood in production.", "An observability plan", "Faster debugging and confidence in live system behavior", "Define health metrics and key logs for a small service.", "Detect why some recommendation requests time out after deployment", "Requirements Analysis", "Treating observability as something to add only after launch", "Design instrumentation as part of the system, not an afterthought", "Use signals to reason about cascading failures and performance regression"),
            Concept("Security by Design", "Building protective controls into the architecture from the beginning.", "Threat models and layered controls", "Reduced risk through intentional architectural safeguards", "Map sensitive flows and add protection points early.", "Protect user identities, progress, and certification records", "API Design", "Adding security checks only after the main system is already built", "Design auth, data protection, and least privilege into the core architecture", "Balance usability, compliance, and risk in platform decisions"),
        ],
    },
]


def main() -> None:
    output = {
        "generated_by": "scripts/generate_question_bank.py",
        "skill_cluster_count": len(SKILLS),
        "question_count_per_skill_cluster": 100,
        "difficulty_breakdown_per_skill_cluster": {
            "easy": 30,
            "medium": 40,
            "hard": 30,
        },
        "skill_clusters": [],
    }

    for skill in SKILLS:
        questions = build_questions(skill["id"], skill["title"], skill["concepts"])  # type: ignore[arg-type]
        if len(questions) != 100:
            raise ValueError(f"{skill['id']} generated {len(questions)} questions instead of 100.")

        difficulty_breakdown = {"easy": 0, "medium": 0, "hard": 0}
        questions_by_difficulty = {"easy": [], "medium": [], "hard": []}
        for question in questions:
            difficulty_breakdown[question["difficulty"]] += 1  # type: ignore[index]
            questions_by_difficulty[question["difficulty"]].append(question)  # type: ignore[index]

        output["skill_clusters"].append(
            {
                "id": skill["id"],
                "continent": skill["continent"],
                "title": skill["title"],
                "question_count": len(questions),
                "difficulty_breakdown": difficulty_breakdown,
                "questions": questions,
                "questions_by_difficulty": questions_by_difficulty,
            }
        )

    output_path = Path("data/question_bank.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
