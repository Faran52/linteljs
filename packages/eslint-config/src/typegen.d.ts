import type { Linter } from 'eslint'

export interface RuleOptions {
  /**
   * Classes decorated with @Component must have suffix "Component" (or custom) in their name. Note: As of v20, this is no longer recommended by the Angular Team.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/component-class-suffix.md
   */
  '@angular-eslint/component-class-suffix'?: Linter.RuleEntry<AngularEslintComponentClassSuffix>
  /**
   * Enforces a maximum number of lines in inline template, styles and animations.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/component-max-inline-declarations.md
   */
  '@angular-eslint/component-max-inline-declarations'?: Linter.RuleEntry<AngularEslintComponentMaxInlineDeclarations>
  /**
   * Component selectors should follow given naming rules. See more at https://angular.dev/style-guide#choosing-component-selectors.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/component-selector.md
   */
  '@angular-eslint/component-selector'?: Linter.RuleEntry<AngularEslintComponentSelector>
  /**
   * Ensures that computed() returns a value. Omitting the value is likely a mistake.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/computed-must-return.md
   */
  '@angular-eslint/computed-must-return'?: Linter.RuleEntry<[]>
  /**
   * Ensures consistent usage of `styles`/`styleUrls`/`styleUrl` within Component metadata
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/consistent-component-styles.md
   */
  '@angular-eslint/consistent-component-styles'?: Linter.RuleEntry<AngularEslintConsistentComponentStyles>
  /**
   * Ensures that classes use contextual decorators in their body
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/contextual-decorator.md
   */
  '@angular-eslint/contextual-decorator'?: Linter.RuleEntry<[]>
  /**
   * Ensures that lifecycle methods are used in a correct context
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/contextual-lifecycle.md
   */
  '@angular-eslint/contextual-lifecycle'?: Linter.RuleEntry<[]>
  /**
   * Classes decorated with @Directive must have suffix "Directive" (or custom) in their name. Note: As of v20, this is no longer recommended by the Angular Team.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/directive-class-suffix.md
   */
  '@angular-eslint/directive-class-suffix'?: Linter.RuleEntry<AngularEslintDirectiveClassSuffix>
  /**
   * Directive selectors should follow given naming rules. See more at https://angular.dev/style-guide#choosing-directive-selectors.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/directive-selector.md
   */
  '@angular-eslint/directive-selector'?: Linter.RuleEntry<AngularEslintDirectiveSelector>
  /**
   * Requires inject() calls to be declared at the top of the class, before any other member
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/inject-at-top.md
   */
  '@angular-eslint/inject-at-top'?: Linter.RuleEntry<AngularEslintInjectAtTop>
  /**
   * Angular Lifecycle methods should not be async. Angular does not wait for async lifecycle but the code incorrectly suggests it does.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-async-lifecycle-method.md
   */
  '@angular-eslint/no-async-lifecycle-method'?: Linter.RuleEntry<[]>
  /**
   * The @Attribute decorator is used to obtain a single value for an attribute. This is a much less common use case than getting a stream of values (using @Input), so the @Attribute decorator is often mistakenly used when @Input is intended. This rule disallows the usage of @Attribute decorator entirely to prevent these mistakes.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-attribute-decorator.md
   */
  '@angular-eslint/no-attribute-decorator'?: Linter.RuleEntry<[]>
  /**
   * Disallow using code which is marked as developer preview
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-developer-preview.md
   */
  '@angular-eslint/no-developer-preview'?: Linter.RuleEntry<[]>
  /**
   * Ensures that metadata arrays do not contain duplicate entries.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-duplicates-in-metadata-arrays.md
   */
  '@angular-eslint/no-duplicates-in-metadata-arrays'?: Linter.RuleEntry<[]>
  /**
   * Disallows declaring empty lifecycle methods
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-empty-lifecycle-method.md
   */
  '@angular-eslint/no-empty-lifecycle-method'?: Linter.RuleEntry<[]>
  /**
   * Disallow using code which is marked as experimental
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-experimental.md
   */
  '@angular-eslint/no-experimental'?: Linter.RuleEntry<[]>
  /**
   * Disallows usage of `forwardRef` references for DI
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-forward-ref.md
   */
  '@angular-eslint/no-forward-ref'?: Linter.RuleEntry<[]>
  /**
   * Ensures that `takeUntilDestroyed()` is called with an explicit `DestroyRef` when used outside of an injection context
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-implicit-take-until-destroyed.md
   */
  '@angular-eslint/no-implicit-take-until-destroyed'?: Linter.RuleEntry<[]>
  /**
   * Ensures that input bindings, including aliases, are not named or prefixed by the configured disallowed prefixes
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-input-prefix.md
   */
  '@angular-eslint/no-input-prefix'?: Linter.RuleEntry<AngularEslintNoInputPrefix>
  /**
   * Ensures that input bindings are not aliased
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-input-rename.md
   */
  '@angular-eslint/no-input-rename'?: Linter.RuleEntry<AngularEslintNoInputRename>
  /**
   * Disallows usage of the `inputs` metadata property
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-inputs-metadata-property.md
   */
  '@angular-eslint/no-inputs-metadata-property'?: Linter.RuleEntry<[]>
  /**
   * Disallows explicit calls to lifecycle methods
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-lifecycle-call.md
   */
  '@angular-eslint/no-lifecycle-call'?: Linter.RuleEntry<[]>
  /**
   * Ensures that output bindings, including aliases, are not named as standard DOM events
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-output-native.md
   */
  '@angular-eslint/no-output-native'?: Linter.RuleEntry<[]>
  /**
   * Ensures that output bindings, including aliases, are not named "on", nor prefixed with it. See more at https://angular.dev/guide/components/outputs#choosing-event-names
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-output-on-prefix.md
   */
  '@angular-eslint/no-output-on-prefix'?: Linter.RuleEntry<[]>
  /**
   * Ensures that output bindings are not aliased
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-output-rename.md
   */
  '@angular-eslint/no-output-rename'?: Linter.RuleEntry<[]>
  /**
   * Disallows usage of the `outputs` metadata property
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-outputs-metadata-property.md
   */
  '@angular-eslint/no-outputs-metadata-property'?: Linter.RuleEntry<[]>
  /**
   * Disallows the declaration of impure pipes
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-pipe-impure.md
   */
  '@angular-eslint/no-pipe-impure'?: Linter.RuleEntry<[]>
  /**
   * Disallows usage of the `queries` metadata property.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-queries-metadata-property.md
   */
  '@angular-eslint/no-queries-metadata-property'?: Linter.RuleEntry<[]>
  /**
   * Warns user about unintentionally doing logic on the signal, rather than the signal's value
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/no-uncalled-signals.md
   */
  '@angular-eslint/no-uncalled-signals'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent prefix for pipes.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/pipe-prefix.md
   */
  '@angular-eslint/pipe-prefix'?: Linter.RuleEntry<AngularEslintPipePrefix>
  /**
   * Use `host` metadata property instead of `@HostBinding` and `HostListener`
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-host-metadata-property.md
   */
  '@angular-eslint/prefer-host-metadata-property'?: Linter.RuleEntry<[]>
  /**
   * Prefer using the inject() function over constructor parameter injection
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-inject.md
   */
  '@angular-eslint/prefer-inject'?: Linter.RuleEntry<[]>
  /**
   * Ensures components do not opt out of the default `ChangeDetectionStrategy.OnPush` change detection strategy
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-on-push-component-change-detection.md
   */
  '@angular-eslint/prefer-on-push-component-change-detection'?: Linter.RuleEntry<AngularEslintPreferOnPushComponentChangeDetection>
  /**
   * Use `OutputEmitterRef` instead of `@Output()`
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-output-emitter-ref.md
   */
  '@angular-eslint/prefer-output-emitter-ref'?: Linter.RuleEntry<[]>
  /**
   * Prefer to declare `@Output`, `OutputEmitterRef` and `OutputRef` as `readonly` since they are not supposed to be reassigned
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-output-readonly.md
   */
  '@angular-eslint/prefer-output-readonly'?: Linter.RuleEntry<[]>
  /**
   * Prefer the `@Service()` decorator over `@Injectable({ providedIn: 'root' })`
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-service-decorator.md
   */
  '@angular-eslint/prefer-service-decorator'?: Linter.RuleEntry<[]>
  /**
   * Use `model` instead of `input` and `output` for two-way bindings
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-signal-model.md
   */
  '@angular-eslint/prefer-signal-model'?: Linter.RuleEntry<AngularEslintPreferSignalModel>
  /**
   * Use readonly signals instead of `@Input()`, `@ViewChild()` and other legacy decorators
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-signals.md
   */
  '@angular-eslint/prefer-signals'?: Linter.RuleEntry<AngularEslintPreferSignals>
  /**
   * Ensures Components, Directives and Pipes do not opt out of standalone.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-standalone.md
   */
  '@angular-eslint/prefer-standalone'?: Linter.RuleEntry<[]>
  /**
   * Ensures that reactive contexts such as computed(), linkedSignal() and effect() read at least one reactive value (a signal). A reactive context with no reactive dependencies never re-runs, which is almost always a mistake.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/reactive-context-must-read-signal.md
   */
  '@angular-eslint/reactive-context-must-read-signal'?: Linter.RuleEntry<AngularEslintReactiveContextMustReadSignal>
  /**
   * The ./ and ../ prefix is standard syntax for relative URLs; don't depend on Angular's current ability to do without that prefix.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/relative-url-prefix.md
   */
  '@angular-eslint/relative-url-prefix'?: Linter.RuleEntry<[]>
  /**
   * Ensures that lifecycle methods are defined on the object's prototype instead of on an instance.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/require-lifecycle-on-prototype.md
   */
  '@angular-eslint/require-lifecycle-on-prototype'?: Linter.RuleEntry<[]>
  /**
   * Ensures that $localize tagged messages contain helpful metadata to aid with translations.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/require-localize-metadata.md
   */
  '@angular-eslint/require-localize-metadata'?: Linter.RuleEntry<AngularEslintRequireLocalizeMetadata>
  /**
   * Ensures that $localize tagged messages can use runtime-loaded translations.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/runtime-localize.md
   */
  '@angular-eslint/runtime-localize'?: Linter.RuleEntry<[]>
  /**
   * Ensures that keys in type decorators (Component, Directive, Injectable, NgModule, Pipe) are sorted in a consistent order
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/sort-keys-in-type-decorator.md
   */
  '@angular-eslint/sort-keys-in-type-decorator'?: Linter.RuleEntry<AngularEslintSortKeysInTypeDecorator>
  /**
   * Ensures that lifecycle methods are declared in order of execution
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/sort-lifecycle-methods.md
   */
  '@angular-eslint/sort-lifecycle-methods'?: Linter.RuleEntry<[]>
  /**
   * [Accessibility] Enforces alternate text for elements which require the alt, aria-label, aria-labelledby attributes.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/alt-text.md
   */
  '@angular-eslint/template/alt-text'?: Linter.RuleEntry<[]>
  /**
   * Ensures that HTML attributes and Angular bindings are sorted based on an expected order
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/attributes-order.md
   */
  '@angular-eslint/template/attributes-order'?: Linter.RuleEntry<AngularEslintTemplateAttributesOrder>
  /**
   * Ensures that the two-way data binding syntax is correct
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/banana-in-box.md
   */
  '@angular-eslint/template/banana-in-box'?: Linter.RuleEntry<[]>
  /**
   * Ensures that a button has a valid type specified
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/button-has-type.md
   */
  '@angular-eslint/template/button-has-type'?: Linter.RuleEntry<AngularEslintTemplateButtonHasType>
  /**
   * [Accessibility] Ensures that the click event is accompanied with at least one key event keyup, keydown or keypress.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/click-events-have-key-events.md
   */
  '@angular-eslint/template/click-events-have-key-events'?: Linter.RuleEntry<AngularEslintTemplateClickEventsHaveKeyEvents>
  /**
   * The conditional complexity should not exceed a rational limit
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/conditional-complexity.md
   */
  '@angular-eslint/template/conditional-complexity'?: Linter.RuleEntry<AngularEslintTemplateConditionalComplexity>
  /**
   * Checks cyclomatic complexity against a specified limit. It is a quantitative measure of the number of linearly independent paths through a program's source code
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/cyclomatic-complexity.md
   */
  '@angular-eslint/template/cyclomatic-complexity'?: Linter.RuleEntry<AngularEslintTemplateCyclomaticComplexity>
  /**
   * [Accessibility] Ensures that the heading, anchor and button elements have content in them
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/elements-content.md
   */
  '@angular-eslint/template/elements-content'?: Linter.RuleEntry<AngularEslintTemplateElementsContent>
  /**
   * Requires `===` and `!==` in place of `==` and `!=`
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/eqeqeq.md
   */
  '@angular-eslint/template/eqeqeq'?: Linter.RuleEntry<AngularEslintTemplateEqeqeq>
  /**
   * Ensures following best practices for i18n. Checks for missing i18n attributes on elements and attributes containing texts. Can also check for texts without i18n attribute, elements that do not use custom ID (@@) feature and duplicate custom IDs
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/i18n.md
   */
  '@angular-eslint/template/i18n'?: Linter.RuleEntry<AngularEslintTemplateI18N>
  /**
   * [Accessibility] Ensures that elements with interactive handlers like `(click)` are focusable.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/interactive-supports-focus.md
   */
  '@angular-eslint/template/interactive-supports-focus'?: Linter.RuleEntry<AngularEslintTemplateInteractiveSupportsFocus>
  /**
   * [Accessibility] Ensures that a label element/component is associated with a form element
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/label-has-associated-control.md
   */
  '@angular-eslint/template/label-has-associated-control'?: Linter.RuleEntry<AngularEslintTemplateLabelHasAssociatedControl>
  /**
   * [Accessibility] Ensures that the mouse events `mouseout` and `mouseover` are accompanied by `focus` and `blur` events respectively. Coding for the keyboard is important for users with physical disabilities who cannot use a mouse, AT compatibility, and screenreader users. See more at https://www.w3.org/WAI/WCAG21/Understanding/keyboard
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/mouse-events-have-key-events.md
   */
  '@angular-eslint/template/mouse-events-have-key-events'?: Linter.RuleEntry<[]>
  /**
   * The use of "$any" nullifies the compile-time benefits of Angular's type system
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-any.md
   */
  '@angular-eslint/template/no-any'?: Linter.RuleEntry<[]>
  /**
   * [Accessibility] Ensures that the `autofocus` attribute is not used
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-autofocus.md
   */
  '@angular-eslint/template/no-autofocus'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling expressions in templates, except for output handlers
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-call-expression.md
   */
  '@angular-eslint/template/no-call-expression'?: Linter.RuleEntry<AngularEslintTemplateNoCallExpression>
  /**
   * [Accessibility] Enforces that no distracting elements are used
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-distracting-elements.md
   */
  '@angular-eslint/template/no-distracting-elements'?: Linter.RuleEntry<[]>
  /**
   * Ensures that there are no duplicate input properties or output event listeners
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-duplicate-attributes.md
   */
  '@angular-eslint/template/no-duplicate-attributes'?: Linter.RuleEntry<AngularEslintTemplateNoDuplicateAttributes>
  /**
   * Ensures that control flow blocks are not empty. Empty control flow blocks usually occur due to refactoring that wasn't completed. They can cause confusion when reading code.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-empty-control-flow.md
   */
  '@angular-eslint/template/no-empty-control-flow'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of inline styles in HTML templates
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-inline-styles.md
   */
  '@angular-eslint/template/no-inline-styles'?: Linter.RuleEntry<AngularEslintTemplateNoInlineStyles>
  /**
   * Ensures that property-binding is used instead of interpolation in attributes.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-interpolation-in-attributes.md
   */
  '@angular-eslint/template/no-interpolation-in-attributes'?: Linter.RuleEntry<AngularEslintTemplateNoInterpolationInAttributes>
  /**
   * Ensures that async pipe results, as well as values used with the async pipe, are not negated
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-negated-async.md
   */
  '@angular-eslint/template/no-negated-async'?: Linter.RuleEntry<[]>
  /**
   * Denies nesting of `<p>` and `<a>` tags.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-nested-tags.md
   */
  '@angular-eslint/template/no-nested-tags'?: Linter.RuleEntry<[]>
  /**
   * Disallows the non-null assertion operator (!) in templates
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-non-null-assertion.md
   */
  '@angular-eslint/template/no-non-null-assertion'?: Linter.RuleEntry<[]>
  /**
   * Disallows using `outerHTML` on elements, which breaks change detection and detaches the element from the Angular view
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-outerhtml.md
   */
  '@angular-eslint/template/no-outerhtml'?: Linter.RuleEntry<[]>
  /**
   * Ensures that the `tabindex` attribute is not positive
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/no-positive-tabindex.md
   */
  '@angular-eslint/template/no-positive-tabindex'?: Linter.RuleEntry<[]>
  /**
   * Prefer using `@else` instead of a second `@if` with the opposite condition to reduce code and make it easier to read.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-at-else.md
   */
  '@angular-eslint/template/prefer-at-else'?: Linter.RuleEntry<[]>
  /**
   * Prefer using `@empty` with `@for` loops instead of a separate `@if` or `@else` block to reduce code and make it easier to read.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-at-empty.md
   */
  '@angular-eslint/template/prefer-at-empty'?: Linter.RuleEntry<[]>
  /**
   * Encourages the use of Angular built-in pipes (e.g. lowercase, uppercase, titlecase) instead of certain JavaScript methods in Angular templates.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-built-in-pipes.md
   */
  '@angular-eslint/template/prefer-built-in-pipes'?: Linter.RuleEntry<AngularEslintTemplatePreferBuiltInPipes>
  /**
   * Suggests using [class] bindings over ngClass where applicable
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-class-binding.md
   */
  '@angular-eslint/template/prefer-class-binding'?: Linter.RuleEntry<[]>
  /**
   * Ensures that contextual variables are used in @for blocks where possible instead of aliasing them.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-contextual-for-variables.md
   */
  '@angular-eslint/template/prefer-contextual-for-variables'?: Linter.RuleEntry<AngularEslintTemplatePreferContextualForVariables>
  /**
   * Ensures that the built-in control flow is used.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-control-flow.md
   */
  '@angular-eslint/template/prefer-control-flow'?: Linter.RuleEntry<[]>
  /**
   * Ensures ngSrc is used instead of src for img elements
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-ngsrc.md
   */
  '@angular-eslint/template/prefer-ngsrc'?: Linter.RuleEntry<[]>
  /**
   * Ensures that self-closing tags are used for elements with a closing tag but no content.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-self-closing-tags.md
   */
  '@angular-eslint/template/prefer-self-closing-tags'?: Linter.RuleEntry<[]>
  /**
   * Ensures that static string values use property assignment instead of property binding.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-static-string-properties.md
   */
  '@angular-eslint/template/prefer-static-string-properties'?: Linter.RuleEntry<AngularEslintTemplatePreferStaticStringProperties>
  /**
   * Suggests using [style] bindings over ngStyle where applicable
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-style-binding.md
   */
  '@angular-eslint/template/prefer-style-binding'?: Linter.RuleEntry<[]>
  /**
   * Ensure that template literals are used instead of concatenating strings or expressions.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/prefer-template-literal.md
   */
  '@angular-eslint/template/prefer-template-literal'?: Linter.RuleEntry<[]>
  /**
   * Requires a `@default` block on every `@switch` to ensure all cases are handled. This is the template equivalent of the `@typescript-eslint/switch-exhaustiveness-check` rule.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/require-switch-default.md
   */
  '@angular-eslint/template/require-switch-default'?: Linter.RuleEntry<[]>
  /**
   * [Accessibility] Ensures elements with ARIA roles have all required properties for that role.
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/role-has-required-aria.md
   */
  '@angular-eslint/template/role-has-required-aria'?: Linter.RuleEntry<[]>
  /**
   * [Accessibility] Ensures that the `scope` attribute is only used on the `<th>` element
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/table-scope.md
   */
  '@angular-eslint/template/table-scope'?: Linter.RuleEntry<[]>
  /**
   * Ensures trackBy function is used
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/use-track-by-function.md
   */
  '@angular-eslint/template/use-track-by-function'?: Linter.RuleEntry<AngularEslintTemplateUseTrackByFunction>
  /**
   * [Accessibility] Ensures that correct ARIA attributes and respective values are used
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/valid-aria.md
   */
  '@angular-eslint/template/valid-aria'?: Linter.RuleEntry<[]>
  /**
   * Component selector must be declared
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/use-component-selector.md
   */
  '@angular-eslint/use-component-selector'?: Linter.RuleEntry<[]>
  /**
   * Disallows using `ViewEncapsulation.None`
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/use-component-view-encapsulation.md
   */
  '@angular-eslint/use-component-view-encapsulation'?: Linter.RuleEntry<[]>
  /**
   * Using the `providedIn` property makes `Injectables` tree-shakable
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/use-injectable-provided-in.md
   */
  '@angular-eslint/use-injectable-provided-in'?: Linter.RuleEntry<AngularEslintUseInjectableProvidedIn>
  /**
   * Ensures that classes implement lifecycle interfaces corresponding to the declared lifecycle methods. See more at https://angular.dev/style-guide#use-lifecycle-hook-interfaces
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/use-lifecycle-interface.md
   */
  '@angular-eslint/use-lifecycle-interface'?: Linter.RuleEntry<[]>
  /**
   * Ensures that `Pipes` implement `PipeTransform` interface
   * @see https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/use-pipe-transform-interface.md
   */
  '@angular-eslint/use-pipe-transform-interface'?: Linter.RuleEntry<[]>
  /**
   * Disallows DOM elements from using 'dangerouslySetInnerHTML'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-dangerously-set-innerhtml
   */
  '@eslint-react/dom-no-dangerously-set-innerhtml'?: Linter.RuleEntry<[]>
  /**
   * Disallows DOM elements from using 'dangerouslySetInnerHTML' and 'children' at the same time.
   * @see https://eslint-react.xyz/docs/rules/dom-no-dangerously-set-innerhtml-with-children
   */
  '@eslint-react/dom-no-dangerously-set-innerhtml-with-children'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'findDOMNode'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-find-dom-node
   */
  '@eslint-react/dom-no-find-dom-node'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'flushSync'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-flush-sync
   */
  '@eslint-react/dom-no-flush-sync'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'ReactDOM.hydrate()' with 'hydrateRoot()'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-hydrate
   */
  '@eslint-react/dom-no-hydrate'?: Linter.RuleEntry<[]>
  /**
   * Enforces an explicit 'type' attribute for 'button' elements.
   * @see https://eslint-react.xyz/docs/rules/dom-no-missing-button-type
   */
  '@eslint-react/dom-no-missing-button-type'?: Linter.RuleEntry<[]>
  /**
   * Enforces an explicit 'sandbox' attribute for 'iframe' elements.
   * @see https://eslint-react.xyz/docs/rules/dom-no-missing-iframe-sandbox
   */
  '@eslint-react/dom-no-missing-iframe-sandbox'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'ReactDOM.render()' with 'createRoot(node).render()'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-render
   */
  '@eslint-react/dom-no-render'?: Linter.RuleEntry<[]>
  /**
   * Disallows the return value of 'ReactDOM.render'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-render-return-value
   */
  '@eslint-react/dom-no-render-return-value'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'javascript:' URLs as attribute values.
   * @see https://eslint-react.xyz/docs/rules/dom-no-script-url
   */
  '@eslint-react/dom-no-script-url'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of string style prop in JSX. Use an object instead.
   * @see https://eslint-react.xyz/docs/rules/dom-no-string-style-prop
   */
  '@eslint-react/dom-no-string-style-prop'?: Linter.RuleEntry<[]>
  /**
   * Disallows unknown 'DOM' properties.
   * @see https://eslint-react.xyz/docs/rules/dom-no-unknown-property
   */
  '@eslint-react/dom-no-unknown-property'?: Linter.RuleEntry<EslintReactDomNoUnknownProperty>
  /**
   * Enforces that the 'sandbox' attribute for 'iframe' elements is not set to unsafe combinations.
   * @see https://eslint-react.xyz/docs/rules/dom-no-unsafe-iframe-sandbox
   */
  '@eslint-react/dom-no-unsafe-iframe-sandbox'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'target="_blank"' without 'rel="noreferrer noopener"'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-unsafe-target-blank
   */
  '@eslint-react/dom-no-unsafe-target-blank'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'useFormState' with 'useActionState'.
   * @see https://eslint-react.xyz/docs/rules/dom-no-use-form-state
   */
  '@eslint-react/dom-no-use-form-state'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'children' in void DOM elements.
   * @see https://eslint-react.xyz/docs/rules/dom-no-void-elements-with-children
   */
  '@eslint-react/dom-no-void-elements-with-children'?: Linter.RuleEntry<[]>
  /**
   * Validates usage of Error Boundaries instead of try/catch for errors in child components.
   * @see https://eslint-react.xyz/docs/rules/error-boundaries
   */
  '@eslint-react/error-boundaries'?: Linter.RuleEntry<[]>
  /**
   * Verifies the list of dependencies for Hooks like 'useEffect' and similar.
   * @see https://github.com/facebook/react/issues/14920
   */
  '@eslint-react/exhaustive-deps'?: Linter.RuleEntry<EslintReactExhaustiveDeps>
  /**
   * Validates against assignment/mutation of globals during render, part of ensuring that side effects must run outside of render.
   * @see https://eslint-react.xyz/docs/rules/globals
   */
  '@eslint-react/globals'?: Linter.RuleEntry<[]>
  /**
   * Validates against mutating props, state, and other immutable values, including through functions passed into frozen contexts such as JSX props, hook arguments, and hook return values.
   * @see https://eslint-react.xyz/docs/rules/immutability
   */
  '@eslint-react/immutability'?: Linter.RuleEntry<[]>
  /**
   * Disallows passing 'children' as a prop.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-children-prop
   */
  '@eslint-react/jsx-no-children-prop'?: Linter.RuleEntry<[]>
  /**
   * Disallows passing 'children' as a prop when children are also passed as nested content.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-children-prop-with-children
   */
  '@eslint-react/jsx-no-children-prop-with-children'?: Linter.RuleEntry<[]>
  /**
   * Prevents comment strings from being accidentally inserted into a JSX element's text nodes.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-comment-textnodes
   */
  '@eslint-react/jsx-no-comment-textnodes'?: Linter.RuleEntry<[]>
  /**
   * Prevent patterns that cause deoptimization when using the automatic JSX runtime.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-key-after-spread
   */
  '@eslint-react/jsx-no-key-after-spread'?: Linter.RuleEntry<[]>
  /**
   * Catches `$` before `{expr}` in JSX — typically from template literal `${expr}` being copy-pasted into JSX without removing the `$`. The `$` "leaks" into the rendered output.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-leaked-dollar
   */
  '@eslint-react/jsx-no-leaked-dollar'?: Linter.RuleEntry<[]>
  /**
   * Catches `;` at the start of JSX text nodes — typically from accidentally placing a statement-ending `;` inside JSX. The `;` "leaks" into the rendered output.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-leaked-semicolon
   */
  '@eslint-react/jsx-no-leaked-semicolon'?: Linter.RuleEntry<[]>
  /**
   * Disallow JSX namespace syntax, as React does not support them.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-namespace
   */
  '@eslint-react/jsx-no-namespace'?: Linter.RuleEntry<[]>
  /**
   * Disallows useless fragment elements.
   * @see https://eslint-react.xyz/docs/rules/jsx-no-useless-fragment
   */
  '@eslint-react/jsx-no-useless-fragment'?: Linter.RuleEntry<EslintReactJsxNoUselessFragment>
  /**
   * Enforces identifier names assigned from `createContext` calls to be a valid component name with the suffix `Context`.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-context-name
   */
  '@eslint-react/naming-convention-context-name'?: Linter.RuleEntry<[]>
  /**
   * Enforces identifier names assigned from 'useId' calls to be either 'id' or end with 'Id'.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-id-name
   */
  '@eslint-react/naming-convention-id-name'?: Linter.RuleEntry<[]>
  /**
   * Enforces identifier names assigned from 'useRef' calls to be either 'ref' or end with 'Ref'.
   * @see https://eslint-react.xyz/docs/rules/naming-convention-ref-name
   */
  '@eslint-react/naming-convention-ref-name'?: Linter.RuleEntry<[]>
  /**
   * Disallows accessing 'this.state' inside 'setState' calls.
   * @see https://eslint-react.xyz/docs/rules/no-access-state-in-setstate
   */
  '@eslint-react/no-access-state-in-setstate'?: Linter.RuleEntry<[]>
  /**
   * Disallows using an item's index in the array as its key.
   * @see https://eslint-react.xyz/docs/rules/no-array-index-key
   */
  '@eslint-react/no-array-index-key'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.count' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-count
   */
  '@eslint-react/no-children-count'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.forEach' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-for-each
   */
  '@eslint-react/no-children-for-each'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.map' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-map
   */
  '@eslint-react/no-children-map'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.only' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-only
   */
  '@eslint-react/no-children-only'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.toArray' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-to-array
   */
  '@eslint-react/no-children-to-array'?: Linter.RuleEntry<[]>
  /**
   * Disallows class components except for error boundaries.
   * @see https://eslint-react.xyz/docs/rules/no-class-component
   */
  '@eslint-react/no-class-component'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'cloneElement'.
   * @see https://eslint-react.xyz/docs/rules/no-clone-element
   */
  '@eslint-react/no-clone-element'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillMount' with 'UNSAFE_componentWillMount'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-mount
   */
  '@eslint-react/no-component-will-mount'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillReceiveProps' with 'UNSAFE_componentWillReceiveProps'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-receive-props
   */
  '@eslint-react/no-component-will-receive-props'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillUpdate' with 'UNSAFE_componentWillUpdate'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-update
   */
  '@eslint-react/no-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of '<Context.Provider>' with '<Context>'.
   * @see https://eslint-react.xyz/docs/rules/no-context-provider
   */
  '@eslint-react/no-context-provider'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'createRef' in function components and Hooks.
   * @see https://eslint-react.xyz/docs/rules/no-create-ref
   */
  '@eslint-react/no-create-ref'?: Linter.RuleEntry<[]>
  /**
   * Disallows direct mutation of 'this.state'.
   * @see https://eslint-react.xyz/docs/rules/no-direct-mutation-state
   */
  '@eslint-react/no-direct-mutation-state'?: Linter.RuleEntry<[]>
  /**
   * Prevents duplicate 'key' props on sibling elements when rendering lists.
   * @see https://eslint-react.xyz/docs/rules/no-duplicate-key
   */
  '@eslint-react/no-duplicate-key'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'forwardRef' with passing 'ref' as a prop.
   * @see https://eslint-react.xyz/docs/rules/no-forward-ref
   */
  '@eslint-react/no-forward-ref'?: Linter.RuleEntry<[]>
  /**
   * Prevents implicitly passing the 'children' prop to components.
   * @see https://eslint-react.xyz/docs/rules/no-implicit-children
   */
  '@eslint-react/no-implicit-children'?: Linter.RuleEntry<[]>
  /**
   * Prevents implicitly passing the 'key' prop to components.
   * @see https://eslint-react.xyz/docs/rules/no-implicit-key
   */
  '@eslint-react/no-implicit-key'?: Linter.RuleEntry<[]>
  /**
   * Prevents implicitly passing the 'ref' prop to components.
   * @see https://eslint-react.xyz/docs/rules/no-implicit-ref
   */
  '@eslint-react/no-implicit-ref'?: Linter.RuleEntry<[]>
  /**
   * Prevents problematic leaked values from being rendered.
   * @see https://eslint-react.xyz/docs/rules/no-leaked-conditional-rendering
   */
  '@eslint-react/no-leaked-conditional-rendering'?: Linter.RuleEntry<[]>
  /**
   * Enforces that all components have a 'displayName' that can be used in DevTools.
   * @see https://eslint-react.xyz/docs/rules/no-missing-component-display-name
   */
  '@eslint-react/no-missing-component-display-name'?: Linter.RuleEntry<[]>
  /**
   * Enforces that all contexts have a 'displayName' that can be used in DevTools.
   * @see https://eslint-react.xyz/docs/rules/no-missing-context-display-name
   */
  '@eslint-react/no-missing-context-display-name'?: Linter.RuleEntry<[]>
  /**
   * Disallows missing 'key' on items in list rendering.
   * @see https://eslint-react.xyz/docs/rules/no-missing-key
   */
  '@eslint-react/no-missing-key'?: Linter.RuleEntry<[]>
  /**
   * Prevents incorrect usage of 'captureOwnerStack'.
   * @see https://eslint-react.xyz/docs/rules/no-misused-capture-owner-stack
   */
  '@eslint-react/no-misused-capture-owner-stack'?: Linter.RuleEntry<[]>
  /**
   * Disallows nesting component definitions inside other components.
   * @see https://eslint-react.xyz/docs/rules/no-nested-component-definitions
   */
  '@eslint-react/no-nested-component-definitions'?: Linter.RuleEntry<[]>
  /**
   * Disallows nesting lazy component declarations inside other components or hooks.
   * @see https://eslint-react.xyz/docs/rules/no-nested-lazy-component-declarations
   */
  '@eslint-react/no-nested-lazy-component-declarations'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentDidMount' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-did-mount
   */
  '@eslint-react/no-set-state-in-component-did-mount'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentDidUpdate' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-did-update
   */
  '@eslint-react/no-set-state-in-component-did-update'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentWillUpdate' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-will-update
   */
  '@eslint-react/no-set-state-in-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Enforces that a function with the 'use' prefix uses at least one Hook inside it.
   * @see https://eslint-react.xyz/docs/rules/no-unnecessary-use-prefix
   */
  '@eslint-react/no-unnecessary-use-prefix'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillMount' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-mount
   */
  '@eslint-react/no-unsafe-component-will-mount'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillReceiveProps' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-receive-props
   */
  '@eslint-react/no-unsafe-component-will-receive-props'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillUpdate' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-update
   */
  '@eslint-react/no-unsafe-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Prevents non-stable values (i.e., object literals) from being used as a value for 'Context.Provider'.
   * @see https://eslint-react.xyz/docs/rules/no-unstable-context-value
   */
  '@eslint-react/no-unstable-context-value'?: Linter.RuleEntry<[]>
  /**
   * Prevents using referential-type values as default props in object destructuring.
   * @see https://eslint-react.xyz/docs/rules/no-unstable-default-props
   */
  '@eslint-react/no-unstable-default-props'?: Linter.RuleEntry<EslintReactNoUnstableDefaultProps>
  /**
   * Warns about unused class component methods and properties.
   * @see https://eslint-react.xyz/docs/rules/no-unused-class-component-members
   */
  '@eslint-react/no-unused-class-component-members'?: Linter.RuleEntry<[]>
  /**
   * Warns about component props that are defined but never used.
   * @see https://eslint-react.xyz/docs/rules/no-unused-props
   */
  '@eslint-react/no-unused-props'?: Linter.RuleEntry<[]>
  /**
   * Warns about state variables that are defined but never used.
   * @see https://eslint-react.xyz/docs/rules/no-unused-state
   */
  '@eslint-react/no-unused-state'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'useContext' with 'use'.
   * @see https://eslint-react.xyz/docs/rules/no-use-context
   */
  '@eslint-react/no-use-context'?: Linter.RuleEntry<[]>
  /**
   * Validates that components and hooks are pure by checking that they do not call known-impure functions during render.
   * @see https://eslint-react.xyz/docs/rules/purity
   */
  '@eslint-react/purity'?: Linter.RuleEntry<[]>
  /**
   * Validates correct usage of refs by checking that 'ref.current' is not read or written during render.
   * @see https://eslint-react.xyz/docs/rules/refs
   */
  '@eslint-react/refs'?: Linter.RuleEntry<[]>
  /**
   * Validates and transforms React Client/Server Function definitions.
   * @see https://eslint-react.xyz/docs/rules/rsc-function-definition
   */
  '@eslint-react/rsc-function-definition'?: Linter.RuleEntry<[]>
  /**
   * Enforces the Rules of Hooks.
   * @see https://react.dev/reference/rules/rules-of-hooks
   */
  '@eslint-react/rules-of-hooks'?: Linter.RuleEntry<EslintReactRulesOfHooks>
  /**
   * Validates against setting state synchronously in an effect, which can lead to re-renders that degrade performance.
   * @see https://eslint-react.xyz/docs/rules/set-state-in-effect
   */
  '@eslint-react/set-state-in-effect'?: Linter.RuleEntry<[]>
  /**
   * Validates against unconditionally setting state during render, which can trigger additional renders and potential infinite render loops.
   * @see https://eslint-react.xyz/docs/rules/set-state-in-render
   */
  '@eslint-react/set-state-in-render'?: Linter.RuleEntry<[]>
  /**
   * Validates that components are static, not recreated every render.
   * @see https://eslint-react.xyz/docs/rules/static-components
   */
  '@eslint-react/static-components'?: Linter.RuleEntry<[]>
  /**
   * Validates against syntax that React Compiler does not support.
   * @see https://eslint-react.xyz/docs/rules/unsupported-syntax
   */
  '@eslint-react/unsupported-syntax'?: Linter.RuleEntry<[]>
  /**
   * Validates that 'useMemo' is called with a callback that returns a value.
   * @see https://eslint-react.xyz/docs/rules/use-memo
   */
  '@eslint-react/use-memo'?: Linter.RuleEntry<[]>
  /**
   * Enforces correct usage of 'useState', including destructuring, symmetric naming of the value and setter, and wrapping expensive initializers in a lazy initializer function.
   * @see https://eslint-react.xyz/docs/rules/use-state
   */
  '@eslint-react/use-state'?: Linter.RuleEntry<EslintReactUseState>
  /**
   * Enforces that every 'addEventListener' in a component or custom hook has a corresponding 'removeEventListener'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-event-listener
   */
  '@eslint-react/web-api-no-leaked-event-listener'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'fetch' in a component or custom hook has a corresponding 'AbortController' abort in the cleanup function.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-fetch
   */
  '@eslint-react/web-api-no-leaked-fetch'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'IntersectionObserver' created in a component or custom hook has a corresponding 'IntersectionObserver.disconnect()'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-intersection-observer
   */
  '@eslint-react/web-api-no-leaked-intersection-observer'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'setInterval' in a component or custom hook has a corresponding 'clearInterval'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-interval
   */
  '@eslint-react/web-api-no-leaked-interval'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'ResizeObserver' created in a component or custom hook has a corresponding 'ResizeObserver.disconnect()'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-resize-observer
   */
  '@eslint-react/web-api-no-leaked-resize-observer'?: Linter.RuleEntry<[]>
  /**
   * Enforces that every 'setTimeout' in a component or custom hook has a corresponding 'clearTimeout'.
   * @see https://eslint-react.xyz/docs/rules/web-api-no-leaked-timeout
   */
  '@eslint-react/web-api-no-leaked-timeout'?: Linter.RuleEntry<[]>
  /**
   * Validates usage of Error Boundaries instead of try/catch for errors in child components.
   * @see https://eslint-react.xyz/docs/rules/error-boundaries
   */
  '@eslint-react/x-error-boundaries'?: Linter.RuleEntry<[]>
  /**
   * Verifies the list of dependencies for Hooks like 'useEffect' and similar.
   * @see https://github.com/facebook/react/issues/14920
   */
  '@eslint-react/x-exhaustive-deps'?: Linter.RuleEntry<EslintReactXExhaustiveDeps>
  /**
   * Validates against assignment/mutation of globals during render, part of ensuring that side effects must run outside of render.
   * @see https://eslint-react.xyz/docs/rules/globals
   */
  '@eslint-react/x-globals'?: Linter.RuleEntry<[]>
  /**
   * Validates against mutating props, state, and other immutable values, including through functions passed into frozen contexts such as JSX props, hook arguments, and hook return values.
   * @see https://eslint-react.xyz/docs/rules/immutability
   */
  '@eslint-react/x-immutability'?: Linter.RuleEntry<[]>
  /**
   * Disallows accessing 'this.state' inside 'setState' calls.
   * @see https://eslint-react.xyz/docs/rules/no-access-state-in-setstate
   */
  '@eslint-react/x-no-access-state-in-setstate'?: Linter.RuleEntry<[]>
  /**
   * Disallows using an item's index in the array as its key.
   * @see https://eslint-react.xyz/docs/rules/no-array-index-key
   */
  '@eslint-react/x-no-array-index-key'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.count' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-count
   */
  '@eslint-react/x-no-children-count'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.forEach' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-for-each
   */
  '@eslint-react/x-no-children-for-each'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.map' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-map
   */
  '@eslint-react/x-no-children-map'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.only' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-only
   */
  '@eslint-react/x-no-children-only'?: Linter.RuleEntry<[]>
  /**
   * Disallows the use of 'Children.toArray' from the 'react' package.
   * @see https://eslint-react.xyz/docs/rules/no-children-to-array
   */
  '@eslint-react/x-no-children-to-array'?: Linter.RuleEntry<[]>
  /**
   * Disallows class components except for error boundaries.
   * @see https://eslint-react.xyz/docs/rules/no-class-component
   */
  '@eslint-react/x-no-class-component'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'cloneElement'.
   * @see https://eslint-react.xyz/docs/rules/no-clone-element
   */
  '@eslint-react/x-no-clone-element'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillMount' with 'UNSAFE_componentWillMount'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-mount
   */
  '@eslint-react/x-no-component-will-mount'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillReceiveProps' with 'UNSAFE_componentWillReceiveProps'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-receive-props
   */
  '@eslint-react/x-no-component-will-receive-props'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'componentWillUpdate' with 'UNSAFE_componentWillUpdate'.
   * @see https://eslint-react.xyz/docs/rules/no-component-will-update
   */
  '@eslint-react/x-no-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of '<Context.Provider>' with '<Context>'.
   * @see https://eslint-react.xyz/docs/rules/no-context-provider
   */
  '@eslint-react/x-no-context-provider'?: Linter.RuleEntry<[]>
  /**
   * Disallows 'createRef' in function components and Hooks.
   * @see https://eslint-react.xyz/docs/rules/no-create-ref
   */
  '@eslint-react/x-no-create-ref'?: Linter.RuleEntry<[]>
  /**
   * Disallows direct mutation of 'this.state'.
   * @see https://eslint-react.xyz/docs/rules/no-direct-mutation-state
   */
  '@eslint-react/x-no-direct-mutation-state'?: Linter.RuleEntry<[]>
  /**
   * Prevents duplicate 'key' props on sibling elements when rendering lists.
   * @see https://eslint-react.xyz/docs/rules/no-duplicate-key
   */
  '@eslint-react/x-no-duplicate-key'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'forwardRef' with passing 'ref' as a prop.
   * @see https://eslint-react.xyz/docs/rules/no-forward-ref
   */
  '@eslint-react/x-no-forward-ref'?: Linter.RuleEntry<[]>
  /**
   * Prevents implicitly passing the 'children' prop to components.
   * @see https://eslint-react.xyz/docs/rules/no-implicit-children
   */
  '@eslint-react/x-no-implicit-children'?: Linter.RuleEntry<[]>
  /**
   * Prevents implicitly passing the 'key' prop to components.
   * @see https://eslint-react.xyz/docs/rules/no-implicit-key
   */
  '@eslint-react/x-no-implicit-key'?: Linter.RuleEntry<[]>
  /**
   * Prevents implicitly passing the 'ref' prop to components.
   * @see https://eslint-react.xyz/docs/rules/no-implicit-ref
   */
  '@eslint-react/x-no-implicit-ref'?: Linter.RuleEntry<[]>
  /**
   * Prevents problematic leaked values from being rendered.
   * @see https://eslint-react.xyz/docs/rules/no-leaked-conditional-rendering
   */
  '@eslint-react/x-no-leaked-conditional-rendering'?: Linter.RuleEntry<[]>
  /**
   * Enforces that all components have a 'displayName' that can be used in DevTools.
   * @see https://eslint-react.xyz/docs/rules/no-missing-component-display-name
   */
  '@eslint-react/x-no-missing-component-display-name'?: Linter.RuleEntry<[]>
  /**
   * Enforces that all contexts have a 'displayName' that can be used in DevTools.
   * @see https://eslint-react.xyz/docs/rules/no-missing-context-display-name
   */
  '@eslint-react/x-no-missing-context-display-name'?: Linter.RuleEntry<[]>
  /**
   * Disallows missing 'key' on items in list rendering.
   * @see https://eslint-react.xyz/docs/rules/no-missing-key
   */
  '@eslint-react/x-no-missing-key'?: Linter.RuleEntry<[]>
  /**
   * Prevents incorrect usage of 'captureOwnerStack'.
   * @see https://eslint-react.xyz/docs/rules/no-misused-capture-owner-stack
   */
  '@eslint-react/x-no-misused-capture-owner-stack'?: Linter.RuleEntry<[]>
  /**
   * Disallows nesting component definitions inside other components.
   * @see https://eslint-react.xyz/docs/rules/no-nested-component-definitions
   */
  '@eslint-react/x-no-nested-component-definitions'?: Linter.RuleEntry<[]>
  /**
   * Disallows nesting lazy component declarations inside other components or hooks.
   * @see https://eslint-react.xyz/docs/rules/no-nested-lazy-component-declarations
   */
  '@eslint-react/x-no-nested-lazy-component-declarations'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentDidMount' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-did-mount
   */
  '@eslint-react/x-no-set-state-in-component-did-mount'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentDidUpdate' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-did-update
   */
  '@eslint-react/x-no-set-state-in-component-did-update'?: Linter.RuleEntry<[]>
  /**
   * Disallows calling 'this.setState' in 'componentWillUpdate' outside functions such as callbacks.
   * @see https://eslint-react.xyz/docs/rules/no-set-state-in-component-will-update
   */
  '@eslint-react/x-no-set-state-in-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Enforces that a function with the 'use' prefix uses at least one Hook inside it.
   * @see https://eslint-react.xyz/docs/rules/no-unnecessary-use-prefix
   */
  '@eslint-react/x-no-unnecessary-use-prefix'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillMount' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-mount
   */
  '@eslint-react/x-no-unsafe-component-will-mount'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillReceiveProps' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-receive-props
   */
  '@eslint-react/x-no-unsafe-component-will-receive-props'?: Linter.RuleEntry<[]>
  /**
   * Warns about the use of 'UNSAFE_componentWillUpdate' in class components.
   * @see https://eslint-react.xyz/docs/rules/no-unsafe-component-will-update
   */
  '@eslint-react/x-no-unsafe-component-will-update'?: Linter.RuleEntry<[]>
  /**
   * Prevents non-stable values (i.e., object literals) from being used as a value for 'Context.Provider'.
   * @see https://eslint-react.xyz/docs/rules/no-unstable-context-value
   */
  '@eslint-react/x-no-unstable-context-value'?: Linter.RuleEntry<[]>
  /**
   * Prevents using referential-type values as default props in object destructuring.
   * @see https://eslint-react.xyz/docs/rules/no-unstable-default-props
   */
  '@eslint-react/x-no-unstable-default-props'?: Linter.RuleEntry<EslintReactXNoUnstableDefaultProps>
  /**
   * Warns about unused class component methods and properties.
   * @see https://eslint-react.xyz/docs/rules/no-unused-class-component-members
   */
  '@eslint-react/x-no-unused-class-component-members'?: Linter.RuleEntry<[]>
  /**
   * Warns about component props that are defined but never used.
   * @see https://eslint-react.xyz/docs/rules/no-unused-props
   */
  '@eslint-react/x-no-unused-props'?: Linter.RuleEntry<[]>
  /**
   * Warns about state variables that are defined but never used.
   * @see https://eslint-react.xyz/docs/rules/no-unused-state
   */
  '@eslint-react/x-no-unused-state'?: Linter.RuleEntry<[]>
  /**
   * Replaces usage of 'useContext' with 'use'.
   * @see https://eslint-react.xyz/docs/rules/no-use-context
   */
  '@eslint-react/x-no-use-context'?: Linter.RuleEntry<[]>
  /**
   * Validates that components and hooks are pure by checking that they do not call known-impure functions during render.
   * @see https://eslint-react.xyz/docs/rules/purity
   */
  '@eslint-react/x-purity'?: Linter.RuleEntry<[]>
  /**
   * Validates correct usage of refs by checking that 'ref.current' is not read or written during render.
   * @see https://eslint-react.xyz/docs/rules/refs
   */
  '@eslint-react/x-refs'?: Linter.RuleEntry<[]>
  /**
   * Enforces the Rules of Hooks.
   * @see https://react.dev/reference/rules/rules-of-hooks
   */
  '@eslint-react/x-rules-of-hooks'?: Linter.RuleEntry<EslintReactXRulesOfHooks>
  /**
   * Validates against setting state synchronously in an effect, which can lead to re-renders that degrade performance.
   * @see https://eslint-react.xyz/docs/rules/set-state-in-effect
   */
  '@eslint-react/x-set-state-in-effect'?: Linter.RuleEntry<[]>
  /**
   * Validates against unconditionally setting state during render, which can trigger additional renders and potential infinite render loops.
   * @see https://eslint-react.xyz/docs/rules/set-state-in-render
   */
  '@eslint-react/x-set-state-in-render'?: Linter.RuleEntry<[]>
  /**
   * Validates that components are static, not recreated every render.
   * @see https://eslint-react.xyz/docs/rules/static-components
   */
  '@eslint-react/x-static-components'?: Linter.RuleEntry<[]>
  /**
   * Validates against syntax that React Compiler does not support.
   * @see https://eslint-react.xyz/docs/rules/unsupported-syntax
   */
  '@eslint-react/x-unsupported-syntax'?: Linter.RuleEntry<[]>
  /**
   * Validates that 'useMemo' is called with a callback that returns a value.
   * @see https://eslint-react.xyz/docs/rules/use-memo
   */
  '@eslint-react/x-use-memo'?: Linter.RuleEntry<[]>
  /**
   * Enforces correct usage of 'useState', including destructuring, symmetric naming of the value and setter, and wrapping expensive initializers in a lazy initializer function.
   * @see https://eslint-react.xyz/docs/rules/use-state
   */
  '@eslint-react/x-use-state'?: Linter.RuleEntry<EslintReactXUseState>
  /**
   * Enforce newline between attributes
   * @see https://html-eslint.org/docs/rules/attrs-newline
   */
  '@html-eslint/attrs-newline'?: Linter.RuleEntry<HtmlEslintAttrsNewline>
  /**
   * Disallow extra spacing in class attribute values
   * @see https://html-eslint.org/docs/rules/class-spacing
   */
  '@html-eslint/class-spacing'?: Linter.RuleEntry<[]>
  /**
   * Disallows empty CSS blocks in `<style>` tags.
   */
  '@html-eslint/css-no-empty-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce newline between elements.
   * @see https://html-eslint.org/docs/rules/element-newline
   */
  '@html-eslint/element-newline'?: Linter.RuleEntry<HtmlEslintElementNewline>
  /**
   * Enforce optimal ordering of elements in `<head>`
   * @see https://html-eslint.org/docs/rules/head-order
   */
  '@html-eslint/head-order'?: Linter.RuleEntry<HtmlEslintHeadOrder>
  /**
   * Enforce consistent naming of id attributes
   * @see https://html-eslint.org/docs/rules/id-naming-convention
   */
  '@html-eslint/id-naming-convention'?: Linter.RuleEntry<HtmlEslintIdNamingConvention>
  /**
   * Enforce consistent indentation
   */
  '@html-eslint/indent'?: Linter.RuleEntry<HtmlEslintIndent>
  /**
   * Enforce use of lowercase for tag and attribute names.
   * @see https://html-eslint.org/docs/rules/lowercase
   */
  '@html-eslint/lowercase'?: Linter.RuleEntry<[]>
  /**
   * Enforce maximum element depth
   * @see https://html-eslint.org/docs/rules/max-element-depth
   */
  '@html-eslint/max-element-depth'?: Linter.RuleEntry<HtmlEslintMaxElementDepth>
  /**
   * Disallow use of abstract roles
   * @see https://html-eslint.org/docs/rules/no-abstract-roles
   */
  '@html-eslint/no-abstract-roles'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of accesskey attribute
   * @see https://html-eslint.org/docs/rules/no-accesskey-attrs
   */
  '@html-eslint/no-accesskey-attrs'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of aria-hidden attributes on the `body` element.
   * @see https://html-eslint.org/docs/rules/no-aria-hidden-body
   */
  '@html-eslint/no-aria-hidden-body'?: Linter.RuleEntry<[]>
  /**
   * Disallow aria-hidden="true" on focusable elements
   * @see https://html-eslint.org/docs/rules/no-aria-hidden-on-focusable
   */
  '@html-eslint/no-aria-hidden-on-focusable'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate attributes
   * @see https://html-eslint.org/docs/rules/no-duplicate-attrs
   */
  '@html-eslint/no-duplicate-attrs'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate class names
   * @see https://html-eslint.org/docs/rules/no-duplicate-class
   */
  '@html-eslint/no-duplicate-class'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate id attributes
   * @see https://html-eslint.org/docs/rules/no-duplicate-id
   */
  '@html-eslint/no-duplicate-id'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate tags in `<head>`
   * @see https://html-eslint.org/docs/rules/no-duplicate-in-head
   */
  '@html-eslint/no-duplicate-in-head'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty or inaccessible headings.
   * @see https://html-eslint.org/docs/rules/no-empty-headings
   */
  '@html-eslint/no-empty-headings'?: Linter.RuleEntry<[]>
  /**
   * Disallow extra spacing around attributes
   * @see https://html-eslint.org/docs/rules/no-extra-spacing-attrs
   * @deprecated
   */
  '@html-eslint/no-extra-spacing-attrs'?: Linter.RuleEntry<HtmlEslintNoExtraSpacingAttrs>
  /**
   * Disallow extra spacing inside tags
   * @see https://html-eslint.org/docs/rules/no-extra-spacing-tags
   */
  '@html-eslint/no-extra-spacing-tags'?: Linter.RuleEntry<HtmlEslintNoExtraSpacingTags>
  /**
   * Disallow unnecessary consecutive spaces
   * @see https://html-eslint.org/docs/rules/no-extra-spacing-text
   */
  '@html-eslint/no-extra-spacing-text'?: Linter.RuleEntry<HtmlEslintNoExtraSpacingText>
  /**
   * Disallows the use of heading elements inside <button>.
   * @see https://html-eslint.org/docs/rules/no-heading-inside-button
   */
  '@html-eslint/no-heading-inside-button'?: Linter.RuleEntry<[]>
  /**
   * Disallow HTML attributes that have no effect in their context
   * @see https://html-eslint.org/docs/rules/no-ineffective-attrs
   */
  '@html-eslint/no-ineffective-attrs'?: Linter.RuleEntry<[]>
  /**
   * Disallow using inline style
   * @see https://html-eslint.org/docs/rules/no-inline-styles
   */
  '@html-eslint/no-inline-styles'?: Linter.RuleEntry<HtmlEslintNoInlineStyles>
  /**
   * Disallow invalid attribute values according to HTML standards
   * @see https://html-eslint.org/docs/rules/no-invalid-attr-value
   */
  '@html-eslint/no-invalid-attr-value'?: Linter.RuleEntry<HtmlEslintNoInvalidAttrValue>
  /**
   * Disallows the use of invalid HTML entities
   * @see https://html-eslint.org/docs/rules/no-invalid-entity
   */
  '@html-eslint/no-invalid-entity'?: Linter.RuleEntry<[]>
  /**
   * Disallows use of invalid role.
   * @see https://html-eslint.org/docs/rules/no-invalid-role
   */
  '@html-eslint/no-invalid-role'?: Linter.RuleEntry<[]>
  /**
   * Disallow multiple empty lines
   * @see https://html-eslint.org/docs/rules/no-multiple-empty-lines
   */
  '@html-eslint/no-multiple-empty-lines'?: Linter.RuleEntry<HtmlEslintNoMultipleEmptyLines>
  /**
   * Disallow multiple `<h1></h1>`.
   * @see https://html-eslint.org/docs/rules/no-multiple-h1
   */
  '@html-eslint/no-multiple-h1'?: Linter.RuleEntry<[]>
  /**
   * Disallows nested interactive elements
   * @see https://html-eslint.org/docs/rules/no-nested-interactive
   */
  '@html-eslint/no-nested-interactive'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of `user-scalable=no` in `<meta name="viewport">`.
   * @see https://html-eslint.org/docs/rules/no-non-scalable-viewport
   */
  '@html-eslint/no-non-scalable-viewport'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of obsolete attributes in HTML5
   * @see https://html-eslint.org/docs/rules/no-obsolete-attrs
   */
  '@html-eslint/no-obsolete-attrs'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of obsolete elements in HTML5
   * @see https://html-eslint.org/docs/rules/no-obsolete-tags
   */
  '@html-eslint/no-obsolete-tags'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of positive `tabindex`.
   * @see https://html-eslint.org/docs/rules/no-positive-tabindex
   */
  '@html-eslint/no-positive-tabindex'?: Linter.RuleEntry<[]>
  /**
   * Disallow redundant role attributes that match the element's implicit role
   * @see https://html-eslint.org/docs/rules/no-redundant-role
   */
  '@html-eslint/no-redundant-role'?: Linter.RuleEntry<[]>
  /**
   * Disallow specified attribute values
   * @see https://html-eslint.org/docs/rules/no-restricted-attr-values
   */
  '@html-eslint/no-restricted-attr-values'?: Linter.RuleEntry<HtmlEslintNoRestrictedAttrValues>
  /**
   * Disallow specified attributes
   * @see https://html-eslint.org/docs/rules/no-restricted-attrs
   */
  '@html-eslint/no-restricted-attrs'?: Linter.RuleEntry<HtmlEslintNoRestrictedAttrs>
  /**
   * Disallow specified tags
   * @see https://html-eslint.org/docs/rules/no-restricted-tags
   */
  '@html-eslint/no-restricted-tags'?: Linter.RuleEntry<HtmlEslintNoRestrictedTags>
  /**
   * Enforce to omit type attributes for style sheets and scripts
   * @see https://html-eslint.org/docs/rules/no-script-style-type
   */
  '@html-eslint/no-script-style-type'?: Linter.RuleEntry<[]>
  /**
   * Disallow skipping heading levels
   * @see https://html-eslint.org/docs/rules/no-skip-heading-levels
   */
  '@html-eslint/no-skip-heading-levels'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of unsafe `target='_blank'`
   * @see https://html-eslint.org/docs/rules/no-target-blank
   */
  '@html-eslint/no-target-blank'?: Linter.RuleEntry<[]>
  /**
   * Disallow trailing whitespace at the end of lines
   * @see https://html-eslint.org/docs/rules/no-trailing-spaces
   */
  '@html-eslint/no-trailing-spaces'?: Linter.RuleEntry<[]>
  /**
   * Disallow tags with only whitespace children.
   * @see https://html-eslint.org/docs/rules/no-whitespace-only-children
   */
  '@html-eslint/no-whitespace-only-children'?: Linter.RuleEntry<HtmlEslintNoWhitespaceOnlyChildren>
  /**
   * Prefer to use HTTPS for embedded resources
   * @see https://html-eslint.org/docs/rules/prefer-https
   */
  '@html-eslint/prefer-https'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent quoting attributes with double(") or single(')
   * @see https://html-eslint.org/docs/rules/quotes
   */
  '@html-eslint/quotes'?: Linter.RuleEntry<HtmlEslintQuotes>
  /**
   * Require specified attributes
   * @see https://html-eslint.org/docs/rules/require-attrs
   */
  '@html-eslint/require-attrs'?: Linter.RuleEntry<HtmlEslintRequireAttrs>
  /**
   * Require use of the button element with a valid type attribute.
   * @see https://html-eslint.org/docs/rules/require-button-type
   */
  '@html-eslint/require-button-type'?: Linter.RuleEntry<[]>
  /**
   * Require closing tags.
   * @see https://html-eslint.org/docs/rules/require-closing-tags
   */
  '@html-eslint/require-closing-tags'?: Linter.RuleEntry<HtmlEslintRequireClosingTags>
  /**
   * Require that certain elements have meaningful content.
   * @see https://html-eslint.org/docs/rules/require-content
   */
  '@html-eslint/require-content'?: Linter.RuleEntry<[]>
  /**
   * Require `<details>` elements to have a `<summary>` as their first child element.
   * @see https://html-eslint.org/docs/rules/require-details-summary
   */
  '@html-eslint/require-details-summary'?: Linter.RuleEntry<[]>
  /**
   * Require `<!DOCTYPE HTML>` in HTML
   * @see https://html-eslint.org/docs/rules/require-doctype
   */
  '@html-eslint/require-doctype'?: Linter.RuleEntry<[]>
  /**
   * Enforces that some elements (img, iframe) have explicitly defined width and height attributes.
   * @see https://html-eslint.org/docs/rules/require-explicit-size
   */
  '@html-eslint/require-explicit-size'?: Linter.RuleEntry<HtmlEslintRequireExplicitSize>
  /**
   * Require `method` attribute in `<form>`
   * @see https://html-eslint.org/docs/rules/require-form-method
   */
  '@html-eslint/require-form-method'?: Linter.RuleEntry<[]>
  /**
   * Require `title` in `<frame>`, `<iframe>`
   * @see https://html-eslint.org/docs/rules/require-frame-title
   */
  '@html-eslint/require-frame-title'?: Linter.RuleEntry<[]>
  /**
   * Require `alt` attribute on `<img>` tag
   * @see https://html-eslint.org/docs/rules/require-img-alt
   */
  '@html-eslint/require-img-alt'?: Linter.RuleEntry<HtmlEslintRequireImgAlt>
  /**
   * Enforces use of label for form elements(`input`, `textarea`, `select`)
   * @see https://html-eslint.org/docs/rules/require-input-label
   */
  '@html-eslint/require-input-label'?: Linter.RuleEntry<[]>
  /**
   * Require `lang` attribute on `<html>` tag
   * @see https://html-eslint.org/docs/rules/require-lang
   */
  '@html-eslint/require-lang'?: Linter.RuleEntry<[]>
  /**
   * Enforce `<li>` to be in `<ul>`, `<ol>` or `<menu>`.
   * @see https://html-eslint.org/docs/rules/require-li-container
   */
  '@html-eslint/require-li-container'?: Linter.RuleEntry<[]>
  /**
   * Enforce use of `<meta charset="...">` in `<head>`
   * @see https://html-eslint.org/docs/rules/require-meta-charset
   */
  '@html-eslint/require-meta-charset'?: Linter.RuleEntry<[]>
  /**
   * Require use of `<meta name="description">` in `<head>`
   * @see https://html-eslint.org/docs/rules/require-meta-description
   */
  '@html-eslint/require-meta-description'?: Linter.RuleEntry<[]>
  /**
   * Enforce use of `<meta name="viewport">` in `<head>`
   * @see https://html-eslint.org/docs/rules/require-meta-viewport
   */
  '@html-eslint/require-meta-viewport'?: Linter.RuleEntry<[]>
  /**
   * Enforce use of specified meta tags for open graph protocol.
   * @see https://html-eslint.org/docs/rules/require-open-graph-protocol
   */
  '@html-eslint/require-open-graph-protocol'?: Linter.RuleEntry<HtmlEslintRequireOpenGraphProtocol>
  /**
   * Require `<title>` in the `<head>`
   * @see https://html-eslint.org/docs/rules/require-title
   */
  '@html-eslint/require-title'?: Linter.RuleEntry<[]>
  /**
   * Enforce priority and alphabetical sorting of attributes
   * @see https://html-eslint.org/docs/rules/sort-attrs
   */
  '@html-eslint/sort-attrs'?: Linter.RuleEntry<HtmlEslintSortAttrs>
  /**
   * Require `viewBox` attribute on `<svg>` elements
   * @see https://html-eslint.org/docs/rules/svg-require-viewbox
   */
  '@html-eslint/svg-require-viewbox'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of baseline features.
   * @see https://html-eslint.org/docs/rules/use-baseline
   */
  '@html-eslint/use-baseline'?: Linter.RuleEntry<HtmlEslintUseBaseline>
  /**
   * Put each element of an array or array pattern with three or more on its own line.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/array-newline
   */
  '@linteljs/array-newline'?: Linter.RuleEntry<[]>
  /**
   * Put each call on its own line once a chain has two calls or a callback with a body.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/chain-call-newline
   */
  '@linteljs/chain-call-newline'?: Linter.RuleEntry<LinteljsChainCallNewline>
  /**
   * Use `//` for short comments and JSDoc blocks for longer prose.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/comment-delimiter
   */
  '@linteljs/comment-delimiter'?: Linter.RuleEntry<[]>
  /**
   * Keep top-level interfaces and type aliases together, after imports and before runtime code.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/interface-order
   */
  '@linteljs/interface-order'?: Linter.RuleEntry<LinteljsInterfaceOrder>
  /**
   * Put each member of an object, object pattern, interface, or type literal with three or more on its own line.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/member-newline
   */
  '@linteljs/member-newline'?: Linter.RuleEntry<LinteljsMemberNewline>
  /**
   * Name an await, a call that takes a call, or an inline array or object in a const before using it.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/name-before-use
   */
  '@linteljs/name-before-use'?: Linter.RuleEntry<LinteljsNameBeforeUse>
  /**
   * Require an accessible name on React Native elements that are announced.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-accessible-name
   */
  '@linteljs/native-accessible-name'?: Linter.RuleEntry<LinteljsNativeAccessibleName>
  /**
   * Disallow controls inside a container marked accessible.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-no-nested-touchables
   */
  '@linteljs/native-no-nested-touchables'?: Linter.RuleEntry<LinteljsNativeNoNestedTouchables>
  /**
   * Require accessibilityActions and onAccessibilityAction to be declared together and well formed.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-valid-accessibility-actions
   */
  '@linteljs/native-valid-accessibility-actions'?: Linter.RuleEntry<[]>
  /**
   * Require accessibilityRole and role values React Native understands.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-valid-accessibility-role
   */
  '@linteljs/native-valid-accessibility-role'?: Linter.RuleEntry<[]>
  /**
   * Require accessibilityState to be an object of the keys React Native reads.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/native-valid-accessibility-state
   */
  '@linteljs/native-valid-accessibility-state'?: Linter.RuleEntry<[]>
  /**
   * Report a second interface of the same name in the same scope.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-duplicate-interface
   */
  '@linteljs/no-duplicate-interface'?: Linter.RuleEntry<[]>
  /**
   * Report duplicate JSX props on the same element.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-duplicate-jsx-props
   */
  '@linteljs/no-duplicate-jsx-props'?: Linter.RuleEntry<[]>
  /**
   * Fix what a rule reports, or name the exemption in the config. Do not disable it inline.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-eslint-disable
   */
  '@linteljs/no-eslint-disable'?: Linter.RuleEntry<LinteljsNoEslintDisable>
  /**
   * Avoid destructuring namespace imports when a named import is enough.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-import-namespace-destructure
   */
  '@linteljs/no-import-namespace-destructure'?: Linter.RuleEntry<[]>
  /**
   * Give an object type a name instead of writing its shape inline.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/no-inline-object-types
   */
  '@linteljs/no-inline-object-types'?: Linter.RuleEntry<LinteljsNoInlineObjectTypes>
  /**
   * Import across aliased directories through the tsconfig alias, and within one relatively.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-alias
   */
  '@linteljs/prefer-alias'?: Linter.RuleEntry<LinteljsPreferAlias>
  /**
   * Prefer arrow functions when the conversion keeps behaviour the same.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-arrow-functions
   */
  '@linteljs/prefer-arrow-functions'?: Linter.RuleEntry<LinteljsPreferArrowFunctions>
  /**
   * Prefer `await` to `.then()`/`.catch()`/`.finally()`, and `try`/`catch` to a rejection handler.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-async-await
   */
  '@linteljs/prefer-async-await'?: Linter.RuleEntry<LinteljsPreferAsyncAwait>
  /**
   * Destructure component props in the function signature instead of reading them one field at a time.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/prefer-destructured-props
   */
  '@linteljs/prefer-destructured-props'?: Linter.RuleEntry<[]>
  /**
   * Import the React names a file uses instead of reaching them through the global namespace.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/react-no-global-namespace
   */
  '@linteljs/react-no-global-namespace'?: Linter.RuleEntry<[]>
  /**
   * Keep hook dependency arrays in a consistent order.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/sort-hook-dependencies
   */
  '@linteljs/sort-hook-dependencies'?: Linter.RuleEntry<LinteljsSortHookDependencies>
  /**
   * Put each specifier of an import or export list with three or more on its own line.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/specifier-newline
   */
  '@linteljs/specifier-newline'?: Linter.RuleEntry<LinteljsSpecifierNewline>
  /**
   * Split union types when object or function members make them hard to read.
   * @see https://github.com/Faran52/linteljs/tree/main/packages/eslint-plugin/src/rules/union-newline
   */
  '@linteljs/union-newline'?: Linter.RuleEntry<LinteljsUnionNewline>
  /**
   * Enforce font-display behavior with Google Fonts.
   * @see https://nextjs.org/docs/messages/google-font-display
   */
  '@next/next/google-font-display'?: Linter.RuleEntry<[]>
  /**
   * Ensure `preconnect` is used with Google Fonts.
   * @see https://nextjs.org/docs/messages/google-font-preconnect
   */
  '@next/next/google-font-preconnect'?: Linter.RuleEntry<[]>
  /**
   * Enforce `id` attribute on `next/script` components with inline content.
   * @see https://nextjs.org/docs/messages/inline-script-id
   */
  '@next/next/inline-script-id'?: Linter.RuleEntry<[]>
  /**
   * Prefer `@next/third-parties/google` when using the inline script for Google Analytics and Tag Manager.
   * @see https://nextjs.org/docs/messages/next-script-for-ga
   */
  '@next/next/next-script-for-ga'?: Linter.RuleEntry<[]>
  /**
   * Prevent assignment to the `module` variable.
   * @see https://nextjs.org/docs/messages/no-assign-module-variable
   */
  '@next/next/no-assign-module-variable'?: Linter.RuleEntry<[]>
  /**
   * Prevent Client Components from being async functions.
   * @see https://nextjs.org/docs/messages/no-async-client-component
   */
  '@next/next/no-async-client-component'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `next/script`'s `beforeInteractive` strategy outside of `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-before-interactive-script-outside-document
   */
  '@next/next/no-before-interactive-script-outside-document'?: Linter.RuleEntry<[]>
  /**
   * Prevent manual stylesheet tags.
   * @see https://nextjs.org/docs/messages/no-css-tags
   */
  '@next/next/no-css-tags'?: Linter.RuleEntry<[]>
  /**
   * Prevent importing `next/document` outside of `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-document-import-in-page
   */
  '@next/next/no-document-import-in-page'?: Linter.RuleEntry<[]>
  /**
   * Prevent duplicate usage of `<Head>` in `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-duplicate-head
   */
  '@next/next/no-duplicate-head'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `<head>` element.
   * @see https://nextjs.org/docs/messages/no-head-element
   */
  '@next/next/no-head-element'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `next/head` in `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-head-import-in-document
   */
  '@next/next/no-head-import-in-document'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `<a>` elements to navigate to internal Next.js pages.
   * @see https://nextjs.org/docs/messages/no-html-link-for-pages
   */
  '@next/next/no-html-link-for-pages'?: Linter.RuleEntry<NextNextNoHtmlLinkForPages>
  /**
   * Prevent usage of `<img>` element due to slower LCP and higher bandwidth.
   * @see https://nextjs.org/docs/messages/no-img-element
   */
  '@next/next/no-img-element'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `location.assign` or `location.href` assignment to navigate to internal Next.js pages.
   * @see https://nextjs.org/docs/messages/no-location-assign-relative-destination
   */
  '@next/next/no-location-assign-relative-destination'?: Linter.RuleEntry<[]>
  /**
   * Prevent page-only custom fonts.
   * @see https://nextjs.org/docs/messages/no-page-custom-font
   */
  '@next/next/no-page-custom-font'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `next/script` in `next/head` component.
   * @see https://nextjs.org/docs/messages/no-script-component-in-head
   */
  '@next/next/no-script-component-in-head'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `styled-jsx` in `pages/_document.js`.
   * @see https://nextjs.org/docs/messages/no-styled-jsx-in-document
   */
  '@next/next/no-styled-jsx-in-document'?: Linter.RuleEntry<[]>
  /**
   * Prevent synchronous scripts.
   * @see https://nextjs.org/docs/messages/no-sync-scripts
   */
  '@next/next/no-sync-scripts'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `<title>` with `Head` component from `next/document`.
   * @see https://nextjs.org/docs/messages/no-title-in-document-head
   */
  '@next/next/no-title-in-document-head'?: Linter.RuleEntry<[]>
  /**
   * Prevent common typos in Next.js data fetching functions.
   */
  '@next/next/no-typos'?: Linter.RuleEntry<[]>
  /**
   * Prevent duplicate polyfills from Polyfill.io.
   * @see https://nextjs.org/docs/messages/no-unwanted-polyfillio
   */
  '@next/next/no-unwanted-polyfillio'?: Linter.RuleEntry<[]>
  /**
   * Ensure that files exporting `defineVars`, `defineConsts`, or `defineMarker` variables end with a configurable extension, defaulting to `.stylex`, with an option to enforce an additional `.const` suffix for `defineConsts`. Mixed exports are not allowed unless explicitly configured for legacy support.
   */
  '@stylexjs/enforce-extension'?: Linter.RuleEntry<StylexjsEnforceExtension>
  /**
   * Disallow using `className` or `style` props on elements that spread `stylex.props()`
   */
  '@stylexjs/no-conflicting-props'?: Linter.RuleEntry<StylexjsNoConflictingProps>
  /**
   * Disallow legacy media query/pseudo class syntax
   * @see https://github.com/facebook/stylex/tree/main/packages/@stylexjs/eslint-plugin
   */
  '@stylexjs/no-legacy-contextual-styles'?: Linter.RuleEntry<StylexjsNoLegacyContextualStyles>
  /**
   * Disallow usage of stylex.when.anySibling, stylex.when.descendant, and stylex.when.siblingAfter due to limited browser support
   */
  '@stylexjs/no-lookahead-selectors'?: Linter.RuleEntry<StylexjsNoLookaheadSelectors>
  '@stylexjs/no-nonstandard-styles'?: Linter.RuleEntry<StylexjsNoNonstandardStyles>
  '@stylexjs/no-unused'?: Linter.RuleEntry<StylexjsNoUnused>
  /**
   * Require style properties to be sorted by key
   * @see https://github.com/facebook/stylex/tree/main/packages/@stylexjs/eslint-plugin
   */
  '@stylexjs/sort-keys'?: Linter.RuleEntry<StylexjsSortKeys>
  /**
   * Require shorthand properties to be split into individual properties
   * @see https://github.com/facebook/stylex/tree/main/packages/@stylexjs/eslint-plugin
   */
  '@stylexjs/valid-shorthands'?: Linter.RuleEntry<StylexjsValidShorthands>
  '@stylexjs/valid-styles'?: Linter.RuleEntry<StylexjsValidStyles>
  /**
   * Enforce linebreaks after opening and before closing array brackets
   * @see https://eslint.style/rules/array-bracket-newline
   */
  '@stylistic/array-bracket-newline'?: Linter.RuleEntry<StylisticArrayBracketNewline>
  /**
   * Enforce consistent spacing inside array brackets
   * @see https://eslint.style/rules/array-bracket-spacing
   */
  '@stylistic/array-bracket-spacing'?: Linter.RuleEntry<StylisticArrayBracketSpacing>
  /**
   * Enforce line breaks after each array element
   * @see https://eslint.style/rules/array-element-newline
   */
  '@stylistic/array-element-newline'?: Linter.RuleEntry<StylisticArrayElementNewline>
  /**
   * Require parentheses around arrow function arguments
   * @see https://eslint.style/rules/arrow-parens
   */
  '@stylistic/arrow-parens'?: Linter.RuleEntry<StylisticArrowParens>
  /**
   * Enforce consistent spacing before and after the arrow in arrow functions
   * @see https://eslint.style/rules/arrow-spacing
   */
  '@stylistic/arrow-spacing'?: Linter.RuleEntry<StylisticArrowSpacing>
  /**
   * Disallow or enforce spaces inside of blocks after opening block and before closing block
   * @see https://eslint.style/rules/block-spacing
   */
  '@stylistic/block-spacing'?: Linter.RuleEntry<StylisticBlockSpacing>
  /**
   * Enforce consistent brace style for blocks
   * @see https://eslint.style/rules/brace-style
   */
  '@stylistic/brace-style'?: Linter.RuleEntry<StylisticBraceStyle>
  /**
   * Require or disallow trailing commas
   * @see https://eslint.style/rules/comma-dangle
   */
  '@stylistic/comma-dangle'?: Linter.RuleEntry<StylisticCommaDangle>
  /**
   * Enforce consistent spacing before and after commas
   * @see https://eslint.style/rules/comma-spacing
   */
  '@stylistic/comma-spacing'?: Linter.RuleEntry<StylisticCommaSpacing>
  /**
   * Enforce consistent comma style
   * @see https://eslint.style/rules/comma-style
   */
  '@stylistic/comma-style'?: Linter.RuleEntry<StylisticCommaStyle>
  /**
   * Enforce consistent spacing inside computed property brackets
   * @see https://eslint.style/rules/computed-property-spacing
   */
  '@stylistic/computed-property-spacing'?: Linter.RuleEntry<StylisticComputedPropertySpacing>
  /**
   * Enforce consistent line breaks after opening and before closing braces
   * @see https://eslint.style/rules/curly-newline
   */
  '@stylistic/curly-newline'?: Linter.RuleEntry<StylisticCurlyNewline>
  /**
   * Enforce consistent newlines before and after dots
   * @see https://eslint.style/rules/dot-location
   */
  '@stylistic/dot-location'?: Linter.RuleEntry<StylisticDotLocation>
  /**
   * Require or disallow newline at the end of files
   * @see https://eslint.style/rules/eol-last
   */
  '@stylistic/eol-last'?: Linter.RuleEntry<StylisticEolLast>
  /**
   * Enforce consistent line break styles for JSX props
   * @see https://eslint.style/rules/jsx-props-style
   */
  '@stylistic/exp-jsx-props-style'?: Linter.RuleEntry<StylisticExpJsxPropsStyle>
  /**
   * Enforce consistent spacing and line break styles inside brackets.
   * @see https://eslint.style/rules/list-style
   */
  '@stylistic/exp-list-style'?: Linter.RuleEntry<StylisticExpListStyle>
  /**
   * Enforce line breaks between arguments of a function call
   * @see https://eslint.style/rules/function-call-argument-newline
   */
  '@stylistic/function-call-argument-newline'?: Linter.RuleEntry<StylisticFunctionCallArgumentNewline>
  /**
   * Require or disallow spacing between function identifiers and their invocations
   * @see https://eslint.style/rules/function-call-spacing
   */
  '@stylistic/function-call-spacing'?: Linter.RuleEntry<StylisticFunctionCallSpacing>
  /**
   * Enforce consistent line breaks inside function parentheses
   * @see https://eslint.style/rules/function-paren-newline
   */
  '@stylistic/function-paren-newline'?: Linter.RuleEntry<StylisticFunctionParenNewline>
  /**
   * Enforce consistent spacing around `*` operators in generator functions
   * @see https://eslint.style/rules/generator-star-spacing
   */
  '@stylistic/generator-star-spacing'?: Linter.RuleEntry<StylisticGeneratorStarSpacing>
  /**
   * Enforce the location of arrow function bodies
   * @see https://eslint.style/rules/implicit-arrow-linebreak
   */
  '@stylistic/implicit-arrow-linebreak'?: Linter.RuleEntry<StylisticImplicitArrowLinebreak>
  /**
   * Enforce consistent indentation
   * @see https://eslint.style/rules/indent
   */
  '@stylistic/indent'?: Linter.RuleEntry<StylisticIndent>
  /**
   * Indentation for binary operators
   * @see https://eslint.style/rules/indent-binary-ops
   */
  '@stylistic/indent-binary-ops'?: Linter.RuleEntry<StylisticIndentBinaryOps>
  /**
   * Enforce or disallow spaces inside of curly braces in JSX attributes and expressions
   * @see https://eslint.style/rules/jsx-child-element-spacing
   */
  '@stylistic/jsx-child-element-spacing'?: Linter.RuleEntry<[]>
  /**
   * Enforce closing bracket location in JSX
   * @see https://eslint.style/rules/jsx-closing-bracket-location
   */
  '@stylistic/jsx-closing-bracket-location'?: Linter.RuleEntry<StylisticJsxClosingBracketLocation>
  /**
   * Enforce closing tag location for multiline JSX
   * @see https://eslint.style/rules/jsx-closing-tag-location
   */
  '@stylistic/jsx-closing-tag-location'?: Linter.RuleEntry<StylisticJsxClosingTagLocation>
  /**
   * Disallow unnecessary JSX expressions when literals alone are sufficient or enforce JSX expressions on literals in JSX children or attributes
   * @see https://eslint.style/rules/jsx-curly-brace-presence
   */
  '@stylistic/jsx-curly-brace-presence'?: Linter.RuleEntry<StylisticJsxCurlyBracePresence>
  /**
   * Enforce consistent linebreaks in curly braces in JSX attributes and expressions
   * @see https://eslint.style/rules/jsx-curly-newline
   */
  '@stylistic/jsx-curly-newline'?: Linter.RuleEntry<StylisticJsxCurlyNewline>
  /**
   * Enforce or disallow spaces inside of curly braces in JSX attributes and expressions
   * @see https://eslint.style/rules/jsx-curly-spacing
   */
  '@stylistic/jsx-curly-spacing'?: Linter.RuleEntry<StylisticJsxCurlySpacing>
  /**
   * Enforce or disallow spaces around equal signs in JSX attributes
   * @see https://eslint.style/rules/jsx-equals-spacing
   */
  '@stylistic/jsx-equals-spacing'?: Linter.RuleEntry<StylisticJsxEqualsSpacing>
  /**
   * Enforce proper position of the first property in JSX
   * @see https://eslint.style/rules/jsx-first-prop-new-line
   */
  '@stylistic/jsx-first-prop-new-line'?: Linter.RuleEntry<StylisticJsxFirstPropNewLine>
  /**
   * Enforce line breaks before and after JSX elements when they are used as arguments to a function.
   * @see https://eslint.style/rules/jsx-function-call-newline
   */
  '@stylistic/jsx-function-call-newline'?: Linter.RuleEntry<StylisticJsxFunctionCallNewline>
  /**
   * Enforce JSX indentation. Deprecated, use `indent` rule instead.
   * @see https://eslint.style/rules/jsx-indent
   * @deprecated
   */
  '@stylistic/jsx-indent'?: Linter.RuleEntry<StylisticJsxIndent>
  /**
   * Enforce props indentation in JSX
   * @see https://eslint.style/rules/jsx-indent-props
   */
  '@stylistic/jsx-indent-props'?: Linter.RuleEntry<StylisticJsxIndentProps>
  /**
   * Enforce maximum of props on a single line in JSX
   * @see https://eslint.style/rules/jsx-max-props-per-line
   */
  '@stylistic/jsx-max-props-per-line'?: Linter.RuleEntry<StylisticJsxMaxPropsPerLine>
  /**
   * Require or prevent a new line after jsx elements and expressions.
   * @see https://eslint.style/rules/jsx-newline
   */
  '@stylistic/jsx-newline'?: Linter.RuleEntry<StylisticJsxNewline>
  /**
   * Require one JSX element per line
   * @see https://eslint.style/rules/jsx-one-expression-per-line
   */
  '@stylistic/jsx-one-expression-per-line'?: Linter.RuleEntry<StylisticJsxOneExpressionPerLine>
  /**
   * Enforce PascalCase for user-defined JSX components
   * @see https://eslint.style/rules/jsx-pascal-case
   */
  '@stylistic/jsx-pascal-case'?: Linter.RuleEntry<StylisticJsxPascalCase>
  /**
   * Disallow multiple spaces between inline JSX props. Deprecated, use `no-multi-spaces` rule instead.
   * @see https://eslint.style/rules/jsx-props-no-multi-spaces
   * @deprecated
   */
  '@stylistic/jsx-props-no-multi-spaces'?: Linter.RuleEntry<[]>
  /**
   * Enforce the consistent use of either double or single quotes in JSX attributes
   * @see https://eslint.style/rules/jsx-quotes
   */
  '@stylistic/jsx-quotes'?: Linter.RuleEntry<StylisticJsxQuotes>
  /**
   * Disallow extra closing tags for components without children
   * @see https://eslint.style/rules/jsx-self-closing-comp
   */
  '@stylistic/jsx-self-closing-comp'?: Linter.RuleEntry<StylisticJsxSelfClosingComp>
  /**
   * Enforce props alphabetical sorting
   * @see https://eslint.style/rules/jsx-sort-props
   * @deprecated
   */
  '@stylistic/jsx-sort-props'?: Linter.RuleEntry<StylisticJsxSortProps>
  /**
   * Enforce whitespace in and around the JSX opening and closing brackets
   * @see https://eslint.style/rules/jsx-tag-spacing
   */
  '@stylistic/jsx-tag-spacing'?: Linter.RuleEntry<StylisticJsxTagSpacing>
  /**
   * Disallow missing parentheses around multiline JSX
   * @see https://eslint.style/rules/jsx-wrap-multilines
   */
  '@stylistic/jsx-wrap-multilines'?: Linter.RuleEntry<StylisticJsxWrapMultilines>
  /**
   * Enforce consistent spacing between property names and type annotations in types and interfaces
   * @see https://eslint.style/rules/key-spacing
   */
  '@stylistic/key-spacing'?: Linter.RuleEntry<StylisticKeySpacing>
  /**
   * Enforce consistent spacing before and after keywords
   * @see https://eslint.style/rules/keyword-spacing
   */
  '@stylistic/keyword-spacing'?: Linter.RuleEntry<StylisticKeywordSpacing>
  /**
   * Enforce position of line comments
   * @see https://eslint.style/rules/line-comment-position
   */
  '@stylistic/line-comment-position'?: Linter.RuleEntry<StylisticLineCommentPosition>
  /**
   * Enforce consistent linebreak style
   * @see https://eslint.style/rules/linebreak-style
   */
  '@stylistic/linebreak-style'?: Linter.RuleEntry<StylisticLinebreakStyle>
  /**
   * Require empty lines around comments
   * @see https://eslint.style/rules/lines-around-comment
   */
  '@stylistic/lines-around-comment'?: Linter.RuleEntry<StylisticLinesAroundComment>
  /**
   * Require or disallow an empty line between class members
   * @see https://eslint.style/rules/lines-between-class-members
   */
  '@stylistic/lines-between-class-members'?: Linter.RuleEntry<StylisticLinesBetweenClassMembers>
  /**
   * Enforce a maximum line length
   * @see https://eslint.style/rules/max-len
   */
  '@stylistic/max-len'?: Linter.RuleEntry<StylisticMaxLen>
  /**
   * Enforce a maximum number of statements allowed per line
   * @see https://eslint.style/rules/max-statements-per-line
   */
  '@stylistic/max-statements-per-line'?: Linter.RuleEntry<StylisticMaxStatementsPerLine>
  /**
   * Require a specific member delimiter style for interfaces and type literals
   * @see https://eslint.style/rules/member-delimiter-style
   */
  '@stylistic/member-delimiter-style'?: Linter.RuleEntry<StylisticMemberDelimiterStyle>
  /**
   * Enforce a particular style for multiline comments
   * @see https://eslint.style/rules/multiline-comment-style
   */
  '@stylistic/multiline-comment-style'?: Linter.RuleEntry<StylisticMultilineCommentStyle>
  /**
   * Enforce newlines between operands of ternary expressions
   * @see https://eslint.style/rules/multiline-ternary
   */
  '@stylistic/multiline-ternary'?: Linter.RuleEntry<StylisticMultilineTernary>
  /**
   * Enforce or disallow parentheses when invoking a constructor with no arguments
   * @see https://eslint.style/rules/new-parens
   */
  '@stylistic/new-parens'?: Linter.RuleEntry<StylisticNewParens>
  /**
   * Require a newline after each call in a method chain
   * @see https://eslint.style/rules/newline-per-chained-call
   */
  '@stylistic/newline-per-chained-call'?: Linter.RuleEntry<StylisticNewlinePerChainedCall>
  /**
   * Disallow arrow functions where they could be confused with comparisons
   * @see https://eslint.style/rules/no-confusing-arrow
   */
  '@stylistic/no-confusing-arrow'?: Linter.RuleEntry<StylisticNoConfusingArrow>
  /**
   * Disallow unnecessary parentheses
   * @see https://eslint.style/rules/no-extra-parens
   */
  '@stylistic/no-extra-parens'?: Linter.RuleEntry<StylisticNoExtraParens>
  /**
   * Disallow unnecessary semicolons
   * @see https://eslint.style/rules/no-extra-semi
   */
  '@stylistic/no-extra-semi'?: Linter.RuleEntry<[]>
  /**
   * Disallow leading or trailing decimal points in numeric literals
   * @see https://eslint.style/rules/no-floating-decimal
   */
  '@stylistic/no-floating-decimal'?: Linter.RuleEntry<[]>
  /**
   * Disallow mixed binary operators
   * @see https://eslint.style/rules/no-mixed-operators
   */
  '@stylistic/no-mixed-operators'?: Linter.RuleEntry<StylisticNoMixedOperators>
  /**
   * Disallow mixed spaces and tabs for indentation
   * @see https://eslint.style/rules/no-mixed-spaces-and-tabs
   */
  '@stylistic/no-mixed-spaces-and-tabs'?: Linter.RuleEntry<StylisticNoMixedSpacesAndTabs>
  /**
   * Disallow multiple spaces
   * @see https://eslint.style/rules/no-multi-spaces
   */
  '@stylistic/no-multi-spaces'?: Linter.RuleEntry<StylisticNoMultiSpaces>
  /**
   * Disallow multiple empty lines
   * @see https://eslint.style/rules/no-multiple-empty-lines
   */
  '@stylistic/no-multiple-empty-lines'?: Linter.RuleEntry<StylisticNoMultipleEmptyLines>
  /**
   * Disallow all tabs
   * @see https://eslint.style/rules/no-tabs
   */
  '@stylistic/no-tabs'?: Linter.RuleEntry<StylisticNoTabs>
  /**
   * Disallow trailing whitespace at the end of lines
   * @see https://eslint.style/rules/no-trailing-spaces
   */
  '@stylistic/no-trailing-spaces'?: Linter.RuleEntry<StylisticNoTrailingSpaces>
  /**
   * Disallow whitespace before properties
   * @see https://eslint.style/rules/no-whitespace-before-property
   */
  '@stylistic/no-whitespace-before-property'?: Linter.RuleEntry<[]>
  /**
   * Enforce the location of single-line statements
   * @see https://eslint.style/rules/nonblock-statement-body-position
   */
  '@stylistic/nonblock-statement-body-position'?: Linter.RuleEntry<StylisticNonblockStatementBodyPosition>
  /**
   * Enforce consistent line breaks after opening and before closing braces
   * @see https://eslint.style/rules/object-curly-newline
   */
  '@stylistic/object-curly-newline'?: Linter.RuleEntry<StylisticObjectCurlyNewline>
  /**
   * Enforce consistent spacing inside braces
   * @see https://eslint.style/rules/object-curly-spacing
   */
  '@stylistic/object-curly-spacing'?: Linter.RuleEntry<StylisticObjectCurlySpacing>
  /**
   * Enforce placing object properties on separate lines
   * @see https://eslint.style/rules/object-property-newline
   */
  '@stylistic/object-property-newline'?: Linter.RuleEntry<StylisticObjectPropertyNewline>
  /**
   * Require or disallow newlines around variable declarations
   * @see https://eslint.style/rules/one-var-declaration-per-line
   */
  '@stylistic/one-var-declaration-per-line'?: Linter.RuleEntry<StylisticOneVarDeclarationPerLine>
  /**
   * Enforce consistent linebreak style for operators
   * @see https://eslint.style/rules/operator-linebreak
   */
  '@stylistic/operator-linebreak'?: Linter.RuleEntry<StylisticOperatorLinebreak>
  /**
   * Require or disallow padding within blocks
   * @see https://eslint.style/rules/padded-blocks
   */
  '@stylistic/padded-blocks'?: Linter.RuleEntry<StylisticPaddedBlocks>
  /**
   * Require or disallow padding lines between statements
   * @see https://eslint.style/rules/padding-line-between-statements
   */
  '@stylistic/padding-line-between-statements'?: Linter.RuleEntry<StylisticPaddingLineBetweenStatements>
  /**
   * Require quotes around object literal, type literal, interfaces and enums property names
   * @see https://eslint.style/rules/quote-props
   */
  '@stylistic/quote-props'?: Linter.RuleEntry<StylisticQuoteProps>
  /**
   * Enforce the consistent use of either backticks, double, or single quotes
   * @see https://eslint.style/rules/quotes
   */
  '@stylistic/quotes'?: Linter.RuleEntry<StylisticQuotes>
  /**
   * Enforce spacing between rest and spread operators and their expressions
   * @see https://eslint.style/rules/rest-spread-spacing
   */
  '@stylistic/rest-spread-spacing'?: Linter.RuleEntry<StylisticRestSpreadSpacing>
  /**
   * Require or disallow semicolons instead of ASI
   * @see https://eslint.style/rules/semi
   */
  '@stylistic/semi'?: Linter.RuleEntry<StylisticSemi>
  /**
   * Enforce consistent spacing before and after semicolons
   * @see https://eslint.style/rules/semi-spacing
   */
  '@stylistic/semi-spacing'?: Linter.RuleEntry<StylisticSemiSpacing>
  /**
   * Enforce location of semicolons
   * @see https://eslint.style/rules/semi-style
   */
  '@stylistic/semi-style'?: Linter.RuleEntry<StylisticSemiStyle>
  /**
   * Enforce consistent spacing before blocks
   * @see https://eslint.style/rules/space-before-blocks
   */
  '@stylistic/space-before-blocks'?: Linter.RuleEntry<StylisticSpaceBeforeBlocks>
  /**
   * Enforce consistent spacing before function parenthesis
   * @see https://eslint.style/rules/space-before-function-paren
   */
  '@stylistic/space-before-function-paren'?: Linter.RuleEntry<StylisticSpaceBeforeFunctionParen>
  /**
   * Enforce consistent spacing inside parentheses
   * @see https://eslint.style/rules/space-in-parens
   */
  '@stylistic/space-in-parens'?: Linter.RuleEntry<StylisticSpaceInParens>
  /**
   * Require spacing around infix operators
   * @see https://eslint.style/rules/space-infix-ops
   */
  '@stylistic/space-infix-ops'?: Linter.RuleEntry<StylisticSpaceInfixOps>
  /**
   * Enforce consistent spacing before or after unary operators
   * @see https://eslint.style/rules/space-unary-ops
   */
  '@stylistic/space-unary-ops'?: Linter.RuleEntry<StylisticSpaceUnaryOps>
  /**
   * Enforce consistent spacing after the `//` or `/*` in a comment
   * @see https://eslint.style/rules/spaced-comment
   */
  '@stylistic/spaced-comment'?: Linter.RuleEntry<StylisticSpacedComment>
  /**
   * Enforce spacing around colons of switch statements
   * @see https://eslint.style/rules/switch-colon-spacing
   */
  '@stylistic/switch-colon-spacing'?: Linter.RuleEntry<StylisticSwitchColonSpacing>
  /**
   * Require or disallow spacing around embedded expressions of template strings
   * @see https://eslint.style/rules/template-curly-spacing
   */
  '@stylistic/template-curly-spacing'?: Linter.RuleEntry<StylisticTemplateCurlySpacing>
  /**
   * Require or disallow spacing between template tags and their literals
   * @see https://eslint.style/rules/template-tag-spacing
   */
  '@stylistic/template-tag-spacing'?: Linter.RuleEntry<StylisticTemplateTagSpacing>
  /**
   * Require consistent spacing around type annotations
   * @see https://eslint.style/rules/type-annotation-spacing
   */
  '@stylistic/type-annotation-spacing'?: Linter.RuleEntry<StylisticTypeAnnotationSpacing>
  /**
   * Enforces consistent spacing inside TypeScript type generics
   * @see https://eslint.style/rules/type-generic-spacing
   */
  '@stylistic/type-generic-spacing'?: Linter.RuleEntry<[]>
  /**
   * Expect space before the type declaration in the named tuple
   * @see https://eslint.style/rules/type-named-tuple-spacing
   */
  '@stylistic/type-named-tuple-spacing'?: Linter.RuleEntry<[]>
  /**
   * Require parentheses around immediate `function` invocations
   * @see https://eslint.style/rules/wrap-iife
   */
  '@stylistic/wrap-iife'?: Linter.RuleEntry<StylisticWrapIife>
  /**
   * Require parenthesis around regex literals
   * @see https://eslint.style/rules/wrap-regex
   */
  '@stylistic/wrap-regex'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing around the `*` in `yield*` expressions
   * @see https://eslint.style/rules/yield-star-spacing
   */
  '@stylistic/yield-star-spacing'?: Linter.RuleEntry<StylisticYieldStarSpacing>
  /**
   * Exhaustive deps rule for useQuery
   * @see https://tanstack.com/query/latest/docs/eslint/exhaustive-deps
   */
  '@tanstack/query/exhaustive-deps'?: Linter.RuleEntry<TanstackQueryExhaustiveDeps>
  /**
   * Ensure correct order of inference sensitive properties for infinite queries
   * @see https://tanstack.com/query/latest/docs/eslint/infinite-query-property-order
   */
  '@tanstack/query/infinite-query-property-order'?: Linter.RuleEntry<[]>
  /**
   * Ensure correct order of inference-sensitive properties in useMutation()
   * @see https://tanstack.com/query/latest/docs/eslint/mutation-property-order
   */
  '@tanstack/query/mutation-property-order'?: Linter.RuleEntry<[]>
  /**
   * Disallows rest destructuring in queries
   * @see https://tanstack.com/query/latest/docs/eslint/no-rest-destructuring
   */
  '@tanstack/query/no-rest-destructuring'?: Linter.RuleEntry<[]>
  /**
   * Disallow putting the result of query hooks directly in a React hook dependency array
   * @see https://tanstack.com/query/latest/docs/eslint/no-unstable-deps
   */
  '@tanstack/query/no-unstable-deps'?: Linter.RuleEntry<[]>
  /**
   * Ensures queryFn returns a non-undefined value
   * @see https://tanstack.com/query/latest/docs/eslint/no-void-query-fn
   */
  '@tanstack/query/no-void-query-fn'?: Linter.RuleEntry<[]>
  /**
   * Prefer using queryOptions() to co-locate queryKey and queryFn
   * @see https://tanstack.com/query/latest/docs/eslint/prefer-query-options
   */
  '@tanstack/query/prefer-query-options'?: Linter.RuleEntry<[]>
  /**
   * Makes sure that QueryClient is stable
   * @see https://tanstack.com/query/latest/docs/eslint/stable-query-client
   */
  '@tanstack/query/stable-query-client'?: Linter.RuleEntry<[]>
  /**
   * Ensure correct order of inference sensitive properties for createRoute functions
   * @see https://tanstack.com/router/latest/docs/eslint/create-route-property-order
   */
  '@tanstack/router/create-route-property-order'?: Linter.RuleEntry<[]>
  /**
   * Ensure route param names are valid JavaScript identifiers
   * @see https://tanstack.com/router/latest/docs/eslint/route-param-names
   */
  '@tanstack/router/route-param-names'?: Linter.RuleEntry<[]>
  /**
   * Require that function overload signatures be consecutive
   * @see https://typescript-eslint.io/rules/adjacent-overload-signatures
   */
  '@typescript-eslint/adjacent-overload-signatures'?: Linter.RuleEntry<[]>
  /**
   * Require consistently using either `T[]` or `Array<T>` for arrays
   * @see https://typescript-eslint.io/rules/array-type
   */
  '@typescript-eslint/array-type'?: Linter.RuleEntry<TypescriptEslintArrayType>
  /**
   * Disallow awaiting a value that is not a Thenable
   * @see https://typescript-eslint.io/rules/await-thenable
   */
  '@typescript-eslint/await-thenable'?: Linter.RuleEntry<[]>
  /**
   * Disallow `@ts-<directive>` comments or require descriptions after directives
   * @see https://typescript-eslint.io/rules/ban-ts-comment
   */
  '@typescript-eslint/ban-ts-comment'?: Linter.RuleEntry<TypescriptEslintBanTsComment>
  /**
   * Disallow `// tslint:<rule-flag>` comments
   * @see https://typescript-eslint.io/rules/ban-tslint-comment
   */
  '@typescript-eslint/ban-tslint-comment'?: Linter.RuleEntry<[]>
  /**
   * Enforce that literals on classes are exposed in a consistent style
   * @see https://typescript-eslint.io/rules/class-literal-property-style
   */
  '@typescript-eslint/class-literal-property-style'?: Linter.RuleEntry<TypescriptEslintClassLiteralPropertyStyle>
  /**
   * Enforce that class methods utilize `this`
   * @see https://typescript-eslint.io/rules/class-methods-use-this
   */
  '@typescript-eslint/class-methods-use-this'?: Linter.RuleEntry<TypescriptEslintClassMethodsUseThis>
  /**
   * Enforce specifying generic type arguments on type annotation or constructor name of a constructor call
   * @see https://typescript-eslint.io/rules/consistent-generic-constructors
   */
  '@typescript-eslint/consistent-generic-constructors'?: Linter.RuleEntry<TypescriptEslintConsistentGenericConstructors>
  /**
   * Require or disallow the `Record` type
   * @see https://typescript-eslint.io/rules/consistent-indexed-object-style
   */
  '@typescript-eslint/consistent-indexed-object-style'?: Linter.RuleEntry<TypescriptEslintConsistentIndexedObjectStyle>
  /**
   * Require `return` statements to either always or never specify values
   * @see https://typescript-eslint.io/rules/consistent-return
   */
  '@typescript-eslint/consistent-return'?: Linter.RuleEntry<TypescriptEslintConsistentReturn>
  /**
   * Enforce consistent usage of type assertions
   * @see https://typescript-eslint.io/rules/consistent-type-assertions
   */
  '@typescript-eslint/consistent-type-assertions'?: Linter.RuleEntry<TypescriptEslintConsistentTypeAssertions>
  /**
   * Enforce type definitions to consistently use either `interface` or `type`
   * @see https://typescript-eslint.io/rules/consistent-type-definitions
   */
  '@typescript-eslint/consistent-type-definitions'?: Linter.RuleEntry<TypescriptEslintConsistentTypeDefinitions>
  /**
   * Enforce consistent usage of type exports
   * @see https://typescript-eslint.io/rules/consistent-type-exports
   */
  '@typescript-eslint/consistent-type-exports'?: Linter.RuleEntry<TypescriptEslintConsistentTypeExports>
  /**
   * Enforce consistent usage of type imports
   * @see https://typescript-eslint.io/rules/consistent-type-imports
   */
  '@typescript-eslint/consistent-type-imports'?: Linter.RuleEntry<TypescriptEslintConsistentTypeImports>
  /**
   * Enforce default parameters to be last
   * @see https://typescript-eslint.io/rules/default-param-last
   */
  '@typescript-eslint/default-param-last'?: Linter.RuleEntry<[]>
  /**
   * Enforce dot notation whenever possible
   * @see https://typescript-eslint.io/rules/dot-notation
   */
  '@typescript-eslint/dot-notation'?: Linter.RuleEntry<TypescriptEslintDotNotation>
  /**
   * Require explicit return types on functions and class methods
   * @see https://typescript-eslint.io/rules/explicit-function-return-type
   */
  '@typescript-eslint/explicit-function-return-type'?: Linter.RuleEntry<TypescriptEslintExplicitFunctionReturnType>
  /**
   * Require explicit accessibility modifiers on class properties and methods
   * @see https://typescript-eslint.io/rules/explicit-member-accessibility
   */
  '@typescript-eslint/explicit-member-accessibility'?: Linter.RuleEntry<TypescriptEslintExplicitMemberAccessibility>
  /**
   * Require explicit return and argument types on exported functions' and classes' public class methods
   * @see https://typescript-eslint.io/rules/explicit-module-boundary-types
   */
  '@typescript-eslint/explicit-module-boundary-types'?: Linter.RuleEntry<TypescriptEslintExplicitModuleBoundaryTypes>
  /**
   * Require or disallow initialization in variable declarations
   * @see https://typescript-eslint.io/rules/init-declarations
   */
  '@typescript-eslint/init-declarations'?: Linter.RuleEntry<TypescriptEslintInitDeclarations>
  /**
   * Enforce a maximum number of parameters in function definitions
   * @see https://typescript-eslint.io/rules/max-params
   */
  '@typescript-eslint/max-params'?: Linter.RuleEntry<TypescriptEslintMaxParams>
  /**
   * Require a consistent member declaration order
   * @see https://typescript-eslint.io/rules/member-ordering
   */
  '@typescript-eslint/member-ordering'?: Linter.RuleEntry<TypescriptEslintMemberOrdering>
  /**
   * Enforce using a particular method signature syntax
   * @see https://typescript-eslint.io/rules/method-signature-style
   */
  '@typescript-eslint/method-signature-style'?: Linter.RuleEntry<TypescriptEslintMethodSignatureStyle>
  /**
   * Enforce naming conventions for everything across a codebase
   * @see https://typescript-eslint.io/rules/naming-convention
   */
  '@typescript-eslint/naming-convention'?: Linter.RuleEntry<TypescriptEslintNamingConvention>
  /**
   * Disallow generic `Array` constructors
   * @see https://typescript-eslint.io/rules/no-array-constructor
   */
  '@typescript-eslint/no-array-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow using the `delete` operator on array values
   * @see https://typescript-eslint.io/rules/no-array-delete
   */
  '@typescript-eslint/no-array-delete'?: Linter.RuleEntry<[]>
  /**
   * Require `.toString()` and `.toLocaleString()` to only be called on objects which provide useful information when stringified
   * @see https://typescript-eslint.io/rules/no-base-to-string
   */
  '@typescript-eslint/no-base-to-string'?: Linter.RuleEntry<TypescriptEslintNoBaseToString>
  /**
   * Disallow non-null assertion in locations that may be confusing
   * @see https://typescript-eslint.io/rules/no-confusing-non-null-assertion
   */
  '@typescript-eslint/no-confusing-non-null-assertion'?: Linter.RuleEntry<[]>
  /**
   * Require expressions of type void to appear in statement position
   * @see https://typescript-eslint.io/rules/no-confusing-void-expression
   */
  '@typescript-eslint/no-confusing-void-expression'?: Linter.RuleEntry<TypescriptEslintNoConfusingVoidExpression>
  /**
   * Disallow using code marked as `@deprecated`
   * @see https://typescript-eslint.io/rules/no-deprecated
   */
  '@typescript-eslint/no-deprecated'?: Linter.RuleEntry<TypescriptEslintNoDeprecated>
  /**
   * Disallow duplicate class members
   * @see https://typescript-eslint.io/rules/no-dupe-class-members
   */
  '@typescript-eslint/no-dupe-class-members'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate enum member values
   * @see https://typescript-eslint.io/rules/no-duplicate-enum-values
   */
  '@typescript-eslint/no-duplicate-enum-values'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate constituents of union or intersection types
   * @see https://typescript-eslint.io/rules/no-duplicate-type-constituents
   */
  '@typescript-eslint/no-duplicate-type-constituents'?: Linter.RuleEntry<TypescriptEslintNoDuplicateTypeConstituents>
  /**
   * Disallow using the `delete` operator on computed key expressions
   * @see https://typescript-eslint.io/rules/no-dynamic-delete
   */
  '@typescript-eslint/no-dynamic-delete'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty functions
   * @see https://typescript-eslint.io/rules/no-empty-function
   */
  '@typescript-eslint/no-empty-function'?: Linter.RuleEntry<TypescriptEslintNoEmptyFunction>
  /**
   * Disallow the declaration of empty interfaces
   * @see https://typescript-eslint.io/rules/no-empty-interface
   * @deprecated
   */
  '@typescript-eslint/no-empty-interface'?: Linter.RuleEntry<TypescriptEslintNoEmptyInterface>
  /**
   * Disallow accidentally using the "empty object" type
   * @see https://typescript-eslint.io/rules/no-empty-object-type
   */
  '@typescript-eslint/no-empty-object-type'?: Linter.RuleEntry<TypescriptEslintNoEmptyObjectType>
  /**
   * Disallow the `any` type
   * @see https://typescript-eslint.io/rules/no-explicit-any
   */
  '@typescript-eslint/no-explicit-any'?: Linter.RuleEntry<TypescriptEslintNoExplicitAny>
  /**
   * Disallow extra non-null assertions
   * @see https://typescript-eslint.io/rules/no-extra-non-null-assertion
   */
  '@typescript-eslint/no-extra-non-null-assertion'?: Linter.RuleEntry<[]>
  /**
   * Disallow classes used as namespaces
   * @see https://typescript-eslint.io/rules/no-extraneous-class
   */
  '@typescript-eslint/no-extraneous-class'?: Linter.RuleEntry<TypescriptEslintNoExtraneousClass>
  /**
   * Require Promise-like statements to be handled appropriately
   * @see https://typescript-eslint.io/rules/no-floating-promises
   */
  '@typescript-eslint/no-floating-promises'?: Linter.RuleEntry<TypescriptEslintNoFloatingPromises>
  /**
   * Disallow iterating over an array with a for-in loop
   * @see https://typescript-eslint.io/rules/no-for-in-array
   */
  '@typescript-eslint/no-for-in-array'?: Linter.RuleEntry<[]>
  /**
   * Disallow type operations that resolve to the "empty object" type
   * @see https://typescript-eslint.io/rules/no-generated-empty-object-type
   */
  '@typescript-eslint/no-generated-empty-object-type'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `eval()`-like functions
   * @see https://typescript-eslint.io/rules/no-implied-eval
   */
  '@typescript-eslint/no-implied-eval'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of top-level import type qualifier when an import only has specifiers with inline type qualifiers
   * @see https://typescript-eslint.io/rules/no-import-type-side-effects
   */
  '@typescript-eslint/no-import-type-side-effects'?: Linter.RuleEntry<[]>
  /**
   * Disallow explicit type declarations for variables or parameters initialized to a number, string, or boolean
   * @see https://typescript-eslint.io/rules/no-inferrable-types
   */
  '@typescript-eslint/no-inferrable-types'?: Linter.RuleEntry<TypescriptEslintNoInferrableTypes>
  /**
   * Disallow `this` keywords outside of classes or class-like objects
   * @see https://typescript-eslint.io/rules/no-invalid-this
   */
  '@typescript-eslint/no-invalid-this'?: Linter.RuleEntry<TypescriptEslintNoInvalidThis>
  /**
   * Disallow `void` type outside of generic or return types
   * @see https://typescript-eslint.io/rules/no-invalid-void-type
   */
  '@typescript-eslint/no-invalid-void-type'?: Linter.RuleEntry<TypescriptEslintNoInvalidVoidType>
  /**
   * Disallow function declarations that contain unsafe references inside loop statements
   * @see https://typescript-eslint.io/rules/no-loop-func
   * @deprecated
   */
  '@typescript-eslint/no-loop-func'?: Linter.RuleEntry<[]>
  /**
   * Disallow literal numbers that lose precision
   * @see https://typescript-eslint.io/rules/no-loss-of-precision
   * @deprecated
   */
  '@typescript-eslint/no-loss-of-precision'?: Linter.RuleEntry<[]>
  /**
   * Disallow magic numbers
   * @see https://typescript-eslint.io/rules/no-magic-numbers
   */
  '@typescript-eslint/no-magic-numbers'?: Linter.RuleEntry<TypescriptEslintNoMagicNumbers>
  /**
   * Disallow the `void` operator except when used to discard a value
   * @see https://typescript-eslint.io/rules/no-meaningless-void-operator
   */
  '@typescript-eslint/no-meaningless-void-operator'?: Linter.RuleEntry<TypescriptEslintNoMeaninglessVoidOperator>
  /**
   * Enforce valid definition of `new` and `constructor`
   * @see https://typescript-eslint.io/rules/no-misused-new
   */
  '@typescript-eslint/no-misused-new'?: Linter.RuleEntry<[]>
  /**
   * Disallow Promises in places not designed to handle them
   * @see https://typescript-eslint.io/rules/no-misused-promises
   */
  '@typescript-eslint/no-misused-promises'?: Linter.RuleEntry<TypescriptEslintNoMisusedPromises>
  /**
   * Disallow using the spread operator when it might cause unexpected behavior
   * @see https://typescript-eslint.io/rules/no-misused-spread
   */
  '@typescript-eslint/no-misused-spread'?: Linter.RuleEntry<TypescriptEslintNoMisusedSpread>
  /**
   * Disallow enums from having both number and string members
   * @see https://typescript-eslint.io/rules/no-mixed-enums
   */
  '@typescript-eslint/no-mixed-enums'?: Linter.RuleEntry<[]>
  /**
   * Disallow TypeScript namespaces
   * @see https://typescript-eslint.io/rules/no-namespace
   */
  '@typescript-eslint/no-namespace'?: Linter.RuleEntry<TypescriptEslintNoNamespace>
  /**
   * Disallow non-null assertions in the left operand of a nullish coalescing operator
   * @see https://typescript-eslint.io/rules/no-non-null-asserted-nullish-coalescing
   */
  '@typescript-eslint/no-non-null-asserted-nullish-coalescing'?: Linter.RuleEntry<[]>
  /**
   * Disallow non-null assertions after an optional chain expression
   * @see https://typescript-eslint.io/rules/no-non-null-asserted-optional-chain
   */
  '@typescript-eslint/no-non-null-asserted-optional-chain'?: Linter.RuleEntry<[]>
  /**
   * Disallow non-null assertions using the `!` postfix operator
   * @see https://typescript-eslint.io/rules/no-non-null-assertion
   */
  '@typescript-eslint/no-non-null-assertion'?: Linter.RuleEntry<[]>
  /**
   * Disallow variable redeclaration
   * @see https://typescript-eslint.io/rules/no-redeclare
   */
  '@typescript-eslint/no-redeclare'?: Linter.RuleEntry<TypescriptEslintNoRedeclare>
  /**
   * Disallow members of unions and intersections that do nothing or override type information
   * @see https://typescript-eslint.io/rules/no-redundant-type-constituents
   */
  '@typescript-eslint/no-redundant-type-constituents'?: Linter.RuleEntry<[]>
  /**
   * Disallow invocation of `require()`
   * @see https://typescript-eslint.io/rules/no-require-imports
   */
  '@typescript-eslint/no-require-imports'?: Linter.RuleEntry<TypescriptEslintNoRequireImports>
  /**
   * Disallow specified modules when loaded by `import`
   * @see https://typescript-eslint.io/rules/no-restricted-imports
   * @deprecated
   */
  '@typescript-eslint/no-restricted-imports'?: Linter.RuleEntry<TypescriptEslintNoRestrictedImports>
  /**
   * Disallow certain types
   * @see https://typescript-eslint.io/rules/no-restricted-types
   */
  '@typescript-eslint/no-restricted-types'?: Linter.RuleEntry<TypescriptEslintNoRestrictedTypes>
  /**
   * Disallow variable declarations from shadowing variables declared in the outer scope
   * @see https://typescript-eslint.io/rules/no-shadow
   */
  '@typescript-eslint/no-shadow'?: Linter.RuleEntry<TypescriptEslintNoShadow>
  /**
   * Disallow aliasing `this`
   * @see https://typescript-eslint.io/rules/no-this-alias
   */
  '@typescript-eslint/no-this-alias'?: Linter.RuleEntry<TypescriptEslintNoThisAlias>
  /**
   * Disallow type aliases
   * @see https://typescript-eslint.io/rules/no-type-alias
   * @deprecated
   */
  '@typescript-eslint/no-type-alias'?: Linter.RuleEntry<TypescriptEslintNoTypeAlias>
  /**
   * Disallow unnecessary equality comparisons against boolean literals
   * @see https://typescript-eslint.io/rules/no-unnecessary-boolean-literal-compare
   */
  '@typescript-eslint/no-unnecessary-boolean-literal-compare'?: Linter.RuleEntry<TypescriptEslintNoUnnecessaryBooleanLiteralCompare>
  /**
   * Disallow conditionals where the type is always truthy or always falsy
   * @see https://typescript-eslint.io/rules/no-unnecessary-condition
   */
  '@typescript-eslint/no-unnecessary-condition'?: Linter.RuleEntry<TypescriptEslintNoUnnecessaryCondition>
  /**
   * Disallow unnecessary assignment of constructor property parameter
   * @see https://typescript-eslint.io/rules/no-unnecessary-parameter-property-assignment
   */
  '@typescript-eslint/no-unnecessary-parameter-property-assignment'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary namespace qualifiers
   * @see https://typescript-eslint.io/rules/no-unnecessary-qualifier
   */
  '@typescript-eslint/no-unnecessary-qualifier'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary template expressions
   * @see https://typescript-eslint.io/rules/no-unnecessary-template-expression
   */
  '@typescript-eslint/no-unnecessary-template-expression'?: Linter.RuleEntry<[]>
  /**
   * Disallow type arguments that are equal to the default
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-arguments
   */
  '@typescript-eslint/no-unnecessary-type-arguments'?: Linter.RuleEntry<[]>
  /**
   * Disallow type assertions that do not change the type of an expression
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-assertion
   */
  '@typescript-eslint/no-unnecessary-type-assertion'?: Linter.RuleEntry<TypescriptEslintNoUnnecessaryTypeAssertion>
  /**
   * Disallow unnecessary constraints on generic types
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-constraint
   */
  '@typescript-eslint/no-unnecessary-type-constraint'?: Linter.RuleEntry<[]>
  /**
   * Disallow conversion idioms when they do not change the type or value of the expression
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-conversion
   */
  '@typescript-eslint/no-unnecessary-type-conversion'?: Linter.RuleEntry<[]>
  /**
   * Disallow type parameters that aren't used multiple times
   * @see https://typescript-eslint.io/rules/no-unnecessary-type-parameters
   */
  '@typescript-eslint/no-unnecessary-type-parameters'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling a function with a value with type `any`
   * @see https://typescript-eslint.io/rules/no-unsafe-argument
   */
  '@typescript-eslint/no-unsafe-argument'?: Linter.RuleEntry<[]>
  /**
   * Disallow assigning a value with type `any` to variables and properties
   * @see https://typescript-eslint.io/rules/no-unsafe-assignment
   */
  '@typescript-eslint/no-unsafe-assignment'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling a value with type `any`
   * @see https://typescript-eslint.io/rules/no-unsafe-call
   */
  '@typescript-eslint/no-unsafe-call'?: Linter.RuleEntry<[]>
  /**
   * Disallow unsafe declaration merging
   * @see https://typescript-eslint.io/rules/no-unsafe-declaration-merging
   */
  '@typescript-eslint/no-unsafe-declaration-merging'?: Linter.RuleEntry<[]>
  /**
   * Disallow assigning non-enum values to enum typed locations
   * @see https://typescript-eslint.io/rules/no-unsafe-enum-assignment
   */
  '@typescript-eslint/no-unsafe-enum-assignment'?: Linter.RuleEntry<[]>
  /**
   * Disallow comparing an enum value with a non-enum value
   * @see https://typescript-eslint.io/rules/no-unsafe-enum-comparison
   */
  '@typescript-eslint/no-unsafe-enum-comparison'?: Linter.RuleEntry<[]>
  /**
   * Disallow using the unsafe built-in Function type
   * @see https://typescript-eslint.io/rules/no-unsafe-function-type
   */
  '@typescript-eslint/no-unsafe-function-type'?: Linter.RuleEntry<[]>
  /**
   * Disallow member access on a value with type `any`
   * @see https://typescript-eslint.io/rules/no-unsafe-member-access
   */
  '@typescript-eslint/no-unsafe-member-access'?: Linter.RuleEntry<TypescriptEslintNoUnsafeMemberAccess>
  /**
   * Disallow returning a value with type `any` from a function
   * @see https://typescript-eslint.io/rules/no-unsafe-return
   */
  '@typescript-eslint/no-unsafe-return'?: Linter.RuleEntry<[]>
  /**
   * Disallow type assertions that narrow a type
   * @see https://typescript-eslint.io/rules/no-unsafe-type-assertion
   */
  '@typescript-eslint/no-unsafe-type-assertion'?: Linter.RuleEntry<[]>
  /**
   * Require unary negation to take a number
   * @see https://typescript-eslint.io/rules/no-unsafe-unary-minus
   */
  '@typescript-eslint/no-unsafe-unary-minus'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused expressions
   * @see https://typescript-eslint.io/rules/no-unused-expressions
   */
  '@typescript-eslint/no-unused-expressions'?: Linter.RuleEntry<TypescriptEslintNoUnusedExpressions>
  /**
   * Disallow unused private class members
   * @see https://typescript-eslint.io/rules/no-unused-private-class-members
   */
  '@typescript-eslint/no-unused-private-class-members'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused variables
   * @see https://typescript-eslint.io/rules/no-unused-vars
   */
  '@typescript-eslint/no-unused-vars'?: Linter.RuleEntry<TypescriptEslintNoUnusedVars>
  /**
   * Disallow the use of variables before they are defined
   * @see https://typescript-eslint.io/rules/no-use-before-define
   */
  '@typescript-eslint/no-use-before-define'?: Linter.RuleEntry<TypescriptEslintNoUseBeforeDefine>
  /**
   * Disallow unnecessary constructors
   * @see https://typescript-eslint.io/rules/no-useless-constructor
   */
  '@typescript-eslint/no-useless-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow default values that will never be used
   * @see https://typescript-eslint.io/rules/no-useless-default-assignment
   */
  '@typescript-eslint/no-useless-default-assignment'?: Linter.RuleEntry<TypescriptEslintNoUselessDefaultAssignment>
  /**
   * Disallow empty exports that don't change anything in a module file
   * @see https://typescript-eslint.io/rules/no-useless-empty-export
   */
  '@typescript-eslint/no-useless-empty-export'?: Linter.RuleEntry<[]>
  /**
   * Disallow `require` statements except in import statements
   * @see https://typescript-eslint.io/rules/no-var-requires
   * @deprecated
   */
  '@typescript-eslint/no-var-requires'?: Linter.RuleEntry<TypescriptEslintNoVarRequires>
  /**
   * Disallow using confusing built-in primitive class wrappers
   * @see https://typescript-eslint.io/rules/no-wrapper-object-types
   */
  '@typescript-eslint/no-wrapper-object-types'?: Linter.RuleEntry<[]>
  /**
   * Enforce non-null assertions over explicit type assertions
   * @see https://typescript-eslint.io/rules/non-nullable-type-assertion-style
   */
  '@typescript-eslint/non-nullable-type-assertion-style'?: Linter.RuleEntry<[]>
  /**
   * Disallow throwing non-`Error` values as exceptions
   * @see https://typescript-eslint.io/rules/only-throw-error
   */
  '@typescript-eslint/only-throw-error'?: Linter.RuleEntry<TypescriptEslintOnlyThrowError>
  /**
   * Require or disallow parameter properties in class constructors
   * @see https://typescript-eslint.io/rules/parameter-properties
   */
  '@typescript-eslint/parameter-properties'?: Linter.RuleEntry<TypescriptEslintParameterProperties>
  /**
   * Enforce the use of `as const` over literal type
   * @see https://typescript-eslint.io/rules/prefer-as-const
   */
  '@typescript-eslint/prefer-as-const'?: Linter.RuleEntry<[]>
  /**
   * Require destructuring from arrays and/or objects
   * @see https://typescript-eslint.io/rules/prefer-destructuring
   */
  '@typescript-eslint/prefer-destructuring'?: Linter.RuleEntry<TypescriptEslintPreferDestructuring>
  /**
   * Require each enum member value to be explicitly initialized
   * @see https://typescript-eslint.io/rules/prefer-enum-initializers
   */
  '@typescript-eslint/prefer-enum-initializers'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of Array.prototype.find() over Array.prototype.filter() followed by [0] when looking for a single result
   * @see https://typescript-eslint.io/rules/prefer-find
   */
  '@typescript-eslint/prefer-find'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of `for-of` loop over the standard `for` loop where possible
   * @see https://typescript-eslint.io/rules/prefer-for-of
   */
  '@typescript-eslint/prefer-for-of'?: Linter.RuleEntry<[]>
  /**
   * Enforce using function types instead of interfaces with call signatures
   * @see https://typescript-eslint.io/rules/prefer-function-type
   */
  '@typescript-eslint/prefer-function-type'?: Linter.RuleEntry<[]>
  /**
   * Enforce `includes` method over `indexOf` method
   * @see https://typescript-eslint.io/rules/prefer-includes
   */
  '@typescript-eslint/prefer-includes'?: Linter.RuleEntry<[]>
  /**
   * Require all enum members to be literal values
   * @see https://typescript-eslint.io/rules/prefer-literal-enum-member
   */
  '@typescript-eslint/prefer-literal-enum-member'?: Linter.RuleEntry<TypescriptEslintPreferLiteralEnumMember>
  /**
   * Require using `namespace` keyword over `module` keyword to declare custom TypeScript modules
   * @see https://typescript-eslint.io/rules/prefer-namespace-keyword
   */
  '@typescript-eslint/prefer-namespace-keyword'?: Linter.RuleEntry<[]>
  /**
   * Enforce using the nullish coalescing operator instead of logical assignments or chaining
   * @see https://typescript-eslint.io/rules/prefer-nullish-coalescing
   */
  '@typescript-eslint/prefer-nullish-coalescing'?: Linter.RuleEntry<TypescriptEslintPreferNullishCoalescing>
  /**
   * Enforce using concise optional chain expressions instead of chained logical ands, negated logical ors, or empty objects
   * @see https://typescript-eslint.io/rules/prefer-optional-chain
   */
  '@typescript-eslint/prefer-optional-chain'?: Linter.RuleEntry<TypescriptEslintPreferOptionalChain>
  /**
   * Require using Error objects as Promise rejection reasons
   * @see https://typescript-eslint.io/rules/prefer-promise-reject-errors
   */
  '@typescript-eslint/prefer-promise-reject-errors'?: Linter.RuleEntry<TypescriptEslintPreferPromiseRejectErrors>
  /**
   * Require private members to be marked as `readonly` if they're never modified outside of the constructor
   * @see https://typescript-eslint.io/rules/prefer-readonly
   */
  '@typescript-eslint/prefer-readonly'?: Linter.RuleEntry<TypescriptEslintPreferReadonly>
  /**
   * Require function parameters to be typed as `readonly` to prevent accidental mutation of inputs
   * @see https://typescript-eslint.io/rules/prefer-readonly-parameter-types
   */
  '@typescript-eslint/prefer-readonly-parameter-types'?: Linter.RuleEntry<TypescriptEslintPreferReadonlyParameterTypes>
  /**
   * Enforce using type parameter when calling `Array#reduce` instead of using a type assertion
   * @see https://typescript-eslint.io/rules/prefer-reduce-type-parameter
   */
  '@typescript-eslint/prefer-reduce-type-parameter'?: Linter.RuleEntry<[]>
  /**
   * Enforce `RegExp#exec` over `String#match` if no global flag is provided
   * @see https://typescript-eslint.io/rules/prefer-regexp-exec
   */
  '@typescript-eslint/prefer-regexp-exec'?: Linter.RuleEntry<[]>
  /**
   * Enforce that `this` is used when only `this` type is returned
   * @see https://typescript-eslint.io/rules/prefer-return-this-type
   */
  '@typescript-eslint/prefer-return-this-type'?: Linter.RuleEntry<[]>
  /**
   * Enforce using `String#startsWith` and `String#endsWith` over other equivalent methods of checking substrings
   * @see https://typescript-eslint.io/rules/prefer-string-starts-ends-with
   */
  '@typescript-eslint/prefer-string-starts-ends-with'?: Linter.RuleEntry<TypescriptEslintPreferStringStartsEndsWith>
  /**
   * Enforce using `@ts-expect-error` over `@ts-ignore`
   * @see https://typescript-eslint.io/rules/prefer-ts-expect-error
   * @deprecated
   */
  '@typescript-eslint/prefer-ts-expect-error'?: Linter.RuleEntry<[]>
  /**
   * Require any function or method that returns a Promise to be marked async
   * @see https://typescript-eslint.io/rules/promise-function-async
   */
  '@typescript-eslint/promise-function-async'?: Linter.RuleEntry<TypescriptEslintPromiseFunctionAsync>
  /**
   * Enforce that `get()` types should be assignable to their equivalent `set()` type
   * @see https://typescript-eslint.io/rules/related-getter-setter-pairs
   */
  '@typescript-eslint/related-getter-setter-pairs'?: Linter.RuleEntry<[]>
  /**
   * Require `Array#sort` and `Array#toSorted` calls to always provide a `compareFunction`
   * @see https://typescript-eslint.io/rules/require-array-sort-compare
   */
  '@typescript-eslint/require-array-sort-compare'?: Linter.RuleEntry<TypescriptEslintRequireArraySortCompare>
  /**
   * Disallow async functions which do not return promises and have no `await` expression
   * @see https://typescript-eslint.io/rules/require-await
   */
  '@typescript-eslint/require-await'?: Linter.RuleEntry<[]>
  /**
   * Require both operands of addition to be the same type and be `bigint`, `number`, or `string`
   * @see https://typescript-eslint.io/rules/restrict-plus-operands
   */
  '@typescript-eslint/restrict-plus-operands'?: Linter.RuleEntry<TypescriptEslintRestrictPlusOperands>
  /**
   * Enforce template literal expressions to be of `string` type
   * @see https://typescript-eslint.io/rules/restrict-template-expressions
   */
  '@typescript-eslint/restrict-template-expressions'?: Linter.RuleEntry<TypescriptEslintRestrictTemplateExpressions>
  /**
   * Enforce consistent awaiting of returned promises
   * @see https://typescript-eslint.io/rules/return-await
   */
  '@typescript-eslint/return-await'?: Linter.RuleEntry<TypescriptEslintReturnAwait>
  /**
   * Enforce constituents of a type union/intersection to be sorted alphabetically
   * @see https://typescript-eslint.io/rules/sort-type-constituents
   * @deprecated
   */
  '@typescript-eslint/sort-type-constituents'?: Linter.RuleEntry<TypescriptEslintSortTypeConstituents>
  /**
   * Disallow certain types in boolean expressions
   * @see https://typescript-eslint.io/rules/strict-boolean-expressions
   */
  '@typescript-eslint/strict-boolean-expressions'?: Linter.RuleEntry<TypescriptEslintStrictBooleanExpressions>
  /**
   * Disallow passing a value-returning function in a position accepting a void function
   * @see https://typescript-eslint.io/rules/strict-void-return
   */
  '@typescript-eslint/strict-void-return'?: Linter.RuleEntry<TypescriptEslintStrictVoidReturn>
  /**
   * Require switch-case statements to be exhaustive
   * @see https://typescript-eslint.io/rules/switch-exhaustiveness-check
   */
  '@typescript-eslint/switch-exhaustiveness-check'?: Linter.RuleEntry<TypescriptEslintSwitchExhaustivenessCheck>
  /**
   * Disallow certain triple slash directives in favor of ES6-style import declarations
   * @see https://typescript-eslint.io/rules/triple-slash-reference
   */
  '@typescript-eslint/triple-slash-reference'?: Linter.RuleEntry<TypescriptEslintTripleSlashReference>
  /**
   * Require type annotations in certain places
   * @see https://typescript-eslint.io/rules/typedef
   * @deprecated
   */
  '@typescript-eslint/typedef'?: Linter.RuleEntry<TypescriptEslintTypedef>
  /**
   * Enforce unbound methods are called with their expected scope
   * @see https://typescript-eslint.io/rules/unbound-method
   */
  '@typescript-eslint/unbound-method'?: Linter.RuleEntry<TypescriptEslintUnboundMethod>
  /**
   * Disallow two overloads that could be unified into one with a union or an optional/rest parameter
   * @see https://typescript-eslint.io/rules/unified-signatures
   */
  '@typescript-eslint/unified-signatures'?: Linter.RuleEntry<TypescriptEslintUnifiedSignatures>
  /**
   * Enforce typing arguments in Promise rejection callbacks as `unknown`
   * @see https://typescript-eslint.io/rules/use-unknown-in-catch-callback-variable
   */
  '@typescript-eslint/use-unknown-in-catch-callback-variable'?: Linter.RuleEntry<[]>
  /**
   * Enforce getter and setter pairs in objects and classes
   * @see https://eslint.org/docs/latest/rules/accessor-pairs
   */
  'accessor-pairs'?: Linter.RuleEntry<AccessorPairs>
  /**
   * Enforce linebreaks after opening and before closing array brackets
   * @see https://eslint.org/docs/latest/rules/array-bracket-newline
   * @deprecated
   */
  'array-bracket-newline'?: Linter.RuleEntry<ArrayBracketNewline>
  /**
   * Enforce consistent spacing inside array brackets
   * @see https://eslint.org/docs/latest/rules/array-bracket-spacing
   * @deprecated
   */
  'array-bracket-spacing'?: Linter.RuleEntry<ArrayBracketSpacing>
  /**
   * Enforce `return` statements in callbacks of array methods
   * @see https://eslint.org/docs/latest/rules/array-callback-return
   */
  'array-callback-return'?: Linter.RuleEntry<ArrayCallbackReturn>
  /**
   * Enforce line breaks after each array element
   * @see https://eslint.org/docs/latest/rules/array-element-newline
   * @deprecated
   */
  'array-element-newline'?: Linter.RuleEntry<ArrayElementNewline>
  /**
   * Require braces around arrow function bodies
   * @see https://eslint.org/docs/latest/rules/arrow-body-style
   */
  'arrow-body-style'?: Linter.RuleEntry<ArrowBodyStyle>
  /**
   * Require parentheses around arrow function arguments
   * @see https://eslint.org/docs/latest/rules/arrow-parens
   * @deprecated
   */
  'arrow-parens'?: Linter.RuleEntry<ArrowParens>
  /**
   * Enforce consistent spacing before and after the arrow in arrow functions
   * @see https://eslint.org/docs/latest/rules/arrow-spacing
   * @deprecated
   */
  'arrow-spacing'?: Linter.RuleEntry<ArrowSpacing>
  /**
   * apply `jsx-a11y/alt-text` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/alt-text/
   */
  'astro/jsx-a11y/alt-text'?: Linter.RuleEntry<AstroJsxA11YAltText>
  /**
   * apply `jsx-a11y/anchor-ambiguous-text` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/anchor-ambiguous-text/
   */
  'astro/jsx-a11y/anchor-ambiguous-text'?: Linter.RuleEntry<AstroJsxA11YAnchorAmbiguousText>
  /**
   * apply `jsx-a11y/anchor-has-content` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/anchor-has-content/
   */
  'astro/jsx-a11y/anchor-has-content'?: Linter.RuleEntry<AstroJsxA11YAnchorHasContent>
  /**
   * apply `jsx-a11y/anchor-is-valid` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/anchor-is-valid/
   */
  'astro/jsx-a11y/anchor-is-valid'?: Linter.RuleEntry<AstroJsxA11YAnchorIsValid>
  /**
   * apply `jsx-a11y/aria-activedescendant-has-tabindex` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/aria-activedescendant-has-tabindex/
   */
  'astro/jsx-a11y/aria-activedescendant-has-tabindex'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/aria-props` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/aria-props/
   */
  'astro/jsx-a11y/aria-props'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/aria-proptypes` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/aria-proptypes/
   */
  'astro/jsx-a11y/aria-proptypes'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/aria-role` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/aria-role/
   */
  'astro/jsx-a11y/aria-role'?: Linter.RuleEntry<AstroJsxA11YAriaRole>
  /**
   * apply `jsx-a11y/aria-unsupported-elements` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/aria-unsupported-elements/
   */
  'astro/jsx-a11y/aria-unsupported-elements'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/autocomplete-valid` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/autocomplete-valid/
   */
  'astro/jsx-a11y/autocomplete-valid'?: Linter.RuleEntry<AstroJsxA11YAutocompleteValid>
  /**
   * apply `jsx-a11y/click-events-have-key-events` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/click-events-have-key-events/
   */
  'astro/jsx-a11y/click-events-have-key-events'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/control-has-associated-label` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/control-has-associated-label/
   */
  'astro/jsx-a11y/control-has-associated-label'?: Linter.RuleEntry<AstroJsxA11YControlHasAssociatedLabel>
  /**
   * apply `jsx-a11y/heading-has-content` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/heading-has-content/
   */
  'astro/jsx-a11y/heading-has-content'?: Linter.RuleEntry<AstroJsxA11YHeadingHasContent>
  /**
   * apply `jsx-a11y/html-has-lang` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/html-has-lang/
   */
  'astro/jsx-a11y/html-has-lang'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/iframe-has-title` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/iframe-has-title/
   */
  'astro/jsx-a11y/iframe-has-title'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/img-redundant-alt` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/img-redundant-alt/
   */
  'astro/jsx-a11y/img-redundant-alt'?: Linter.RuleEntry<AstroJsxA11YImgRedundantAlt>
  /**
   * apply `jsx-a11y/interactive-supports-focus` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/interactive-supports-focus/
   */
  'astro/jsx-a11y/interactive-supports-focus'?: Linter.RuleEntry<AstroJsxA11YInteractiveSupportsFocus>
  /**
   * apply `jsx-a11y/label-has-associated-control` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/label-has-associated-control/
   */
  'astro/jsx-a11y/label-has-associated-control'?: Linter.RuleEntry<AstroJsxA11YLabelHasAssociatedControl>
  /**
   * apply `jsx-a11y/lang` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/lang/
   */
  'astro/jsx-a11y/lang'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/media-has-caption` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/media-has-caption/
   */
  'astro/jsx-a11y/media-has-caption'?: Linter.RuleEntry<AstroJsxA11YMediaHasCaption>
  /**
   * apply `jsx-a11y/mouse-events-have-key-events` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/mouse-events-have-key-events/
   */
  'astro/jsx-a11y/mouse-events-have-key-events'?: Linter.RuleEntry<AstroJsxA11YMouseEventsHaveKeyEvents>
  /**
   * apply `jsx-a11y/no-access-key` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-access-key/
   */
  'astro/jsx-a11y/no-access-key'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/no-aria-hidden-on-focusable` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-aria-hidden-on-focusable/
   */
  'astro/jsx-a11y/no-aria-hidden-on-focusable'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/no-autofocus` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-autofocus/
   */
  'astro/jsx-a11y/no-autofocus'?: Linter.RuleEntry<AstroJsxA11YNoAutofocus>
  /**
   * apply `jsx-a11y/no-distracting-elements` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-distracting-elements/
   */
  'astro/jsx-a11y/no-distracting-elements'?: Linter.RuleEntry<AstroJsxA11YNoDistractingElements>
  /**
   * apply `jsx-a11y/no-interactive-element-to-noninteractive-role` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-interactive-element-to-noninteractive-role/
   */
  'astro/jsx-a11y/no-interactive-element-to-noninteractive-role'?: Linter.RuleEntry<AstroJsxA11YNoInteractiveElementToNoninteractiveRole>
  /**
   * apply `jsx-a11y/no-noninteractive-element-interactions` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-noninteractive-element-interactions/
   */
  'astro/jsx-a11y/no-noninteractive-element-interactions'?: Linter.RuleEntry<AstroJsxA11YNoNoninteractiveElementInteractions>
  /**
   * apply `jsx-a11y/no-noninteractive-element-to-interactive-role` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-noninteractive-element-to-interactive-role/
   */
  'astro/jsx-a11y/no-noninteractive-element-to-interactive-role'?: Linter.RuleEntry<AstroJsxA11YNoNoninteractiveElementToInteractiveRole>
  /**
   * apply `jsx-a11y/no-noninteractive-tabindex` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-noninteractive-tabindex/
   */
  'astro/jsx-a11y/no-noninteractive-tabindex'?: Linter.RuleEntry<AstroJsxA11YNoNoninteractiveTabindex>
  /**
   * apply `jsx-a11y/no-redundant-roles` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-redundant-roles/
   */
  'astro/jsx-a11y/no-redundant-roles'?: Linter.RuleEntry<AstroJsxA11YNoRedundantRoles>
  /**
   * apply `jsx-a11y/no-static-element-interactions` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/no-static-element-interactions/
   */
  'astro/jsx-a11y/no-static-element-interactions'?: Linter.RuleEntry<AstroJsxA11YNoStaticElementInteractions>
  /**
   * apply `jsx-a11y/prefer-tag-over-role` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/prefer-tag-over-role/
   */
  'astro/jsx-a11y/prefer-tag-over-role'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/role-has-required-aria-props` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/role-has-required-aria-props/
   */
  'astro/jsx-a11y/role-has-required-aria-props'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/role-supports-aria-props` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/role-supports-aria-props/
   */
  'astro/jsx-a11y/role-supports-aria-props'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/scope` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/scope/
   */
  'astro/jsx-a11y/scope'?: Linter.RuleEntry<[]>
  /**
   * apply `jsx-a11y/tabindex-no-positive` rule to Astro components
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/jsx-a11y/tabindex-no-positive/
   */
  'astro/jsx-a11y/tabindex-no-positive'?: Linter.RuleEntry<[]>
  /**
   * the client:only directive is missing the correct component's framework value
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/missing-client-only-directive-value/
   */
  'astro/missing-client-only-directive-value'?: Linter.RuleEntry<[]>
  /**
   * disallow conflicting set directives and child contents
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-conflict-set-directives/
   */
  'astro/no-conflict-set-directives'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `Astro.canonicalURL`
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-deprecated-astro-canonicalurl/
   */
  'astro/no-deprecated-astro-canonicalurl'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `Astro.fetchContent()`
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-deprecated-astro-fetchcontent/
   */
  'astro/no-deprecated-astro-fetchcontent'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `Astro.resolve()`
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-deprecated-astro-resolve/
   */
  'astro/no-deprecated-astro-resolve'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `getEntryBySlug()`
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-deprecated-getentrybyslug/
   */
  'astro/no-deprecated-getentrybyslug'?: Linter.RuleEntry<[]>
  /**
   * disallow value export
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-exports-from-components/
   */
  'astro/no-exports-from-components'?: Linter.RuleEntry<[]>
  /**
   * disallow omitted end tags
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-omitted-end-tags/
   * @deprecated
   */
  'astro/no-omitted-end-tags'?: Linter.RuleEntry<[]>
  /**
   * disallow `prerender` export outside of pages/ directory
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-prerender-export-outside-pages/
   */
  'astro/no-prerender-export-outside-pages'?: Linter.RuleEntry<[]>
  /**
   * disallow use of `set:html` to prevent XSS attack
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-set-html-directive/
   */
  'astro/no-set-html-directive'?: Linter.RuleEntry<[]>
  /**
   * disallow use of `set:text`
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-set-text-directive/
   */
  'astro/no-set-text-directive'?: Linter.RuleEntry<[]>
  /**
   * disallow inline `<script>` without `src` to encourage CSP-safe patterns
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-unsafe-inline-scripts/
   */
  'astro/no-unsafe-inline-scripts'?: Linter.RuleEntry<AstroNoUnsafeInlineScripts>
  /**
   * disallow selectors defined in `style` tag that don't use in HTML
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-unused-css-selector/
   */
  'astro/no-unused-css-selector'?: Linter.RuleEntry<[]>
  /**
   * disallow unused `define:vars={...}` in `style` tag
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/no-unused-define-vars-in-style/
   */
  'astro/no-unused-define-vars-in-style'?: Linter.RuleEntry<[]>
  /**
   * require `class:list` directives instead of `class` with expressions
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/prefer-class-list-directive/
   */
  'astro/prefer-class-list-directive'?: Linter.RuleEntry<[]>
  /**
   * require use object instead of ternary expression in `class:list`
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/prefer-object-class-list/
   */
  'astro/prefer-object-class-list'?: Linter.RuleEntry<[]>
  /**
   * require use split array elements in `class:list`
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/prefer-split-class-list/
   */
  'astro/prefer-split-class-list'?: Linter.RuleEntry<AstroPreferSplitClassList>
  /**
   * Require or disallow semicolons instead of ASI
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/semi/
   */
  'astro/semi'?: Linter.RuleEntry<AstroSemi>
  /**
   * enforce sorting of attributes
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/sort-attributes/
   */
  'astro/sort-attributes'?: Linter.RuleEntry<AstroSortAttributes>
  /**
   * disallow warnings when compiling.
   * @see https://ota-meshi.github.io/eslint-plugin-astro/rules/valid-compile/
   * @deprecated
   */
  'astro/valid-compile'?: Linter.RuleEntry<[]>
  /**
   * Enforce canonical class names.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-canonical-classes.md
   */
  'better-tailwindcss/enforce-canonical-classes'?: Linter.RuleEntry<BetterTailwindcssEnforceCanonicalClasses>
  /**
   * Enforce a consistent order for tailwind classes.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-class-order.md
   */
  'better-tailwindcss/enforce-consistent-class-order'?: Linter.RuleEntry<BetterTailwindcssEnforceConsistentClassOrder>
  /**
   * Enforce consistent important position for classes.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-important-position.md
   */
  'better-tailwindcss/enforce-consistent-important-position'?: Linter.RuleEntry<BetterTailwindcssEnforceConsistentImportantPosition>
  /**
   * Enforce consistent line wrapping for tailwind classes.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-line-wrapping.md
   */
  'better-tailwindcss/enforce-consistent-line-wrapping'?: Linter.RuleEntry<BetterTailwindcssEnforceConsistentLineWrapping>
  /**
   * Enforce consistent syntax for css variables.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-variable-syntax.md
   */
  'better-tailwindcss/enforce-consistent-variable-syntax'?: Linter.RuleEntry<BetterTailwindcssEnforceConsistentVariableSyntax>
  /**
   * Enforce a consistent variant order for Tailwind classes.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-consistent-variant-order.md
   */
  'better-tailwindcss/enforce-consistent-variant-order'?: Linter.RuleEntry<BetterTailwindcssEnforceConsistentVariantOrder>
  /**
   * Enforce logical property class names instead of physical directions.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-logical-properties.md
   */
  'better-tailwindcss/enforce-logical-properties'?: Linter.RuleEntry<BetterTailwindcssEnforceLogicalProperties>
  /**
   * Enforce shorthand class names instead of longhand class names.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/enforce-shorthand-classes.md
   */
  'better-tailwindcss/enforce-shorthand-classes'?: Linter.RuleEntry<BetterTailwindcssEnforceShorthandClasses>
  /**
   * Disallow concatenated classes in Tailwind CSS class strings.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-concatenated-classes.md
   */
  'better-tailwindcss/no-concatenated-classes'?: Linter.RuleEntry<BetterTailwindcssNoConcatenatedClasses>
  /**
   * Disallow classes that produce conflicting styles.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-conflicting-classes.md
   */
  'better-tailwindcss/no-conflicting-classes'?: Linter.RuleEntry<BetterTailwindcssNoConflictingClasses>
  /**
   * Disallow the use of deprecated Tailwind CSS classes.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-deprecated-classes.md
   */
  'better-tailwindcss/no-deprecated-classes'?: Linter.RuleEntry<BetterTailwindcssNoDeprecatedClasses>
  /**
   * Disallow duplicate class names in tailwind classes.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-duplicate-classes.md
   */
  'better-tailwindcss/no-duplicate-classes'?: Linter.RuleEntry<BetterTailwindcssNoDuplicateClasses>
  /**
   * Disallow restricted classes.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-restricted-classes.md
   */
  'better-tailwindcss/no-restricted-classes'?: Linter.RuleEntry<BetterTailwindcssNoRestrictedClasses>
  /**
   * Disallow any css classes that are not registered in tailwindcss.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-unknown-classes.md
   */
  'better-tailwindcss/no-unknown-classes'?: Linter.RuleEntry<BetterTailwindcssNoUnknownClasses>
  /**
   * Disallow unnecessary whitespace between Tailwind CSS classes.
   * @see https://github.com/schoero/eslint-plugin-better-tailwindcss/blob/main/docs/rules/no-unnecessary-whitespace.md
   */
  'better-tailwindcss/no-unnecessary-whitespace'?: Linter.RuleEntry<BetterTailwindcssNoUnnecessaryWhitespace>
  /**
   * Enforce the use of variables within the scope they are defined
   * @see https://eslint.org/docs/latest/rules/block-scoped-var
   */
  'block-scoped-var'?: Linter.RuleEntry<[]>
  /**
   * Disallow or enforce spaces inside of blocks after opening block and before closing block
   * @see https://eslint.org/docs/latest/rules/block-spacing
   * @deprecated
   */
  'block-spacing'?: Linter.RuleEntry<BlockSpacing>
  /**
   * Enforce consistent brace style for blocks
   * @see https://eslint.org/docs/latest/rules/brace-style
   * @deprecated
   */
  'brace-style'?: Linter.RuleEntry<BraceStyle>
  /**
   * Require `return` statements after callbacks
   * @see https://eslint.org/docs/latest/rules/callback-return
   * @deprecated
   */
  'callback-return'?: Linter.RuleEntry<CallbackReturn>
  /**
   * Enforce camelcase naming convention
   * @see https://eslint.org/docs/latest/rules/camelcase
   */
  'camelcase'?: Linter.RuleEntry<Camelcase>
  /**
   * Enforce or disallow capitalization of the first letter of a comment
   * @see https://eslint.org/docs/latest/rules/capitalized-comments
   */
  'capitalized-comments'?: Linter.RuleEntry<CapitalizedComments>
  /**
   * The filename should be blocklisted
   * @see https://github.com/dukeluo/eslint-plugin-check-file/blob/main/docs/rules/filename-blocklist.md
   */
  'check-file/filename-blocklist'?: Linter.RuleEntry<CheckFileFilenameBlocklist>
  /**
   * The filename should follow the filename naming convention
   * @see https://github.com/dukeluo/eslint-plugin-check-file/blob/main/docs/rules/filename-naming-convention.md
   */
  'check-file/filename-naming-convention'?: Linter.RuleEntry<CheckFileFilenameNamingConvention>
  /**
   * The folder should match the naming pattern specified by its file
   * @see https://github.com/dukeluo/eslint-plugin-check-file/blob/main/docs/rules/folder-match-with-fex.md
   */
  'check-file/folder-match-with-fex'?: Linter.RuleEntry<CheckFileFolderMatchWithFex>
  /**
   * The folder should follow the folder naming convention
   * @see https://github.com/dukeluo/eslint-plugin-check-file/blob/main/docs/rules/folder-naming-convention.md
   */
  'check-file/folder-naming-convention'?: Linter.RuleEntry<CheckFileFolderNamingConvention>
  /**
   * A file cannot be named "index"
   * @see https://github.com/dukeluo/eslint-plugin-check-file/blob/main/docs/rules/no-index.md
   */
  'check-file/no-index'?: Linter.RuleEntry<CheckFileNoIndex>
  /**
   * Enforce that class methods utilize `this`
   * @see https://eslint.org/docs/latest/rules/class-methods-use-this
   */
  'class-methods-use-this'?: Linter.RuleEntry<ClassMethodsUseThis>
  /**
   * Require or disallow trailing commas
   * @see https://eslint.org/docs/latest/rules/comma-dangle
   * @deprecated
   */
  'comma-dangle'?: Linter.RuleEntry<CommaDangle>
  /**
   * Enforce consistent spacing before and after commas
   * @see https://eslint.org/docs/latest/rules/comma-spacing
   * @deprecated
   */
  'comma-spacing'?: Linter.RuleEntry<CommaSpacing>
  /**
   * Enforce consistent comma style
   * @see https://eslint.org/docs/latest/rules/comma-style
   * @deprecated
   */
  'comma-style'?: Linter.RuleEntry<CommaStyle>
  /**
   * Enforce a maximum cyclomatic complexity allowed in a program
   * @see https://eslint.org/docs/latest/rules/complexity
   */
  'complexity'?: Linter.RuleEntry<Complexity>
  /**
   * Enforce consistent spacing inside computed property brackets
   * @see https://eslint.org/docs/latest/rules/computed-property-spacing
   * @deprecated
   */
  'computed-property-spacing'?: Linter.RuleEntry<ComputedPropertySpacing>
  /**
   * Require `return` statements to either always or never specify values
   * @see https://eslint.org/docs/latest/rules/consistent-return
   */
  'consistent-return'?: Linter.RuleEntry<ConsistentReturn>
  /**
   * Enforce consistent naming when capturing the current execution context
   * @see https://eslint.org/docs/latest/rules/consistent-this
   */
  'consistent-this'?: Linter.RuleEntry<ConsistentThis>
  /**
   * Require `super()` calls in constructors
   * @see https://eslint.org/docs/latest/rules/constructor-super
   */
  'constructor-super'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent brace style for all control statements
   * @see https://eslint.org/docs/latest/rules/curly
   */
  'curly'?: Linter.RuleEntry<Curly>
  /**
   * Require `default` cases in `switch` statements
   * @see https://eslint.org/docs/latest/rules/default-case
   */
  'default-case'?: Linter.RuleEntry<DefaultCase>
  /**
   * Enforce `default` clauses in `switch` statements to be last
   * @see https://eslint.org/docs/latest/rules/default-case-last
   */
  'default-case-last'?: Linter.RuleEntry<[]>
  /**
   * Enforce default parameters to be last
   * @see https://eslint.org/docs/latest/rules/default-param-last
   */
  'default-param-last'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent newlines before and after dots
   * @see https://eslint.org/docs/latest/rules/dot-location
   * @deprecated
   */
  'dot-location'?: Linter.RuleEntry<DotLocation>
  /**
   * Enforce dot notation whenever possible
   * @see https://eslint.org/docs/latest/rules/dot-notation
   */
  'dot-notation'?: Linter.RuleEntry<DotNotation>
  /**
   * Require or disallow newline at the end of files
   * @see https://eslint.org/docs/latest/rules/eol-last
   * @deprecated
   */
  'eol-last'?: Linter.RuleEntry<EolLast>
  /**
   * Require the use of `===` and `!==`
   * @see https://eslint.org/docs/latest/rules/eqeqeq
   */
  'eqeqeq'?: Linter.RuleEntry<Eqeqeq>
  /**
   * Enforce `for` loop update clause moving the counter in the right direction
   * @see https://eslint.org/docs/latest/rules/for-direction
   */
  'for-direction'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing between function identifiers and their invocations
   * @see https://eslint.org/docs/latest/rules/func-call-spacing
   * @deprecated
   */
  'func-call-spacing'?: Linter.RuleEntry<FuncCallSpacing>
  /**
   * Require function names to match the name of the variable or property to which they are assigned
   * @see https://eslint.org/docs/latest/rules/func-name-matching
   */
  'func-name-matching'?: Linter.RuleEntry<FuncNameMatching>
  /**
   * Require or disallow named `function` expressions
   * @see https://eslint.org/docs/latest/rules/func-names
   */
  'func-names'?: Linter.RuleEntry<FuncNames>
  /**
   * Enforce the consistent use of either `function` declarations or expressions assigned to variables
   * @see https://eslint.org/docs/latest/rules/func-style
   */
  'func-style'?: Linter.RuleEntry<FuncStyle>
  /**
   * Enforce line breaks between arguments of a function call
   * @see https://eslint.org/docs/latest/rules/function-call-argument-newline
   * @deprecated
   */
  'function-call-argument-newline'?: Linter.RuleEntry<FunctionCallArgumentNewline>
  /**
   * Enforce consistent line breaks inside function parentheses
   * @see https://eslint.org/docs/latest/rules/function-paren-newline
   * @deprecated
   */
  'function-paren-newline'?: Linter.RuleEntry<FunctionParenNewline>
  /**
   * Enforce consistent spacing around `*` operators in generator functions
   * @see https://eslint.org/docs/latest/rules/generator-star-spacing
   * @deprecated
   */
  'generator-star-spacing'?: Linter.RuleEntry<GeneratorStarSpacing>
  /**
   * Enforce `return` statements in getters
   * @see https://eslint.org/docs/latest/rules/getter-return
   */
  'getter-return'?: Linter.RuleEntry<GetterReturn>
  /**
   * Require `require()` calls to be placed at top-level module scope
   * @see https://eslint.org/docs/latest/rules/global-require
   * @deprecated
   */
  'global-require'?: Linter.RuleEntry<[]>
  /**
   * Require grouped accessor pairs in object literals and classes
   * @see https://eslint.org/docs/latest/rules/grouped-accessor-pairs
   */
  'grouped-accessor-pairs'?: Linter.RuleEntry<GroupedAccessorPairs>
  /**
   * Require `for-in` loops to include an `if` statement
   * @see https://eslint.org/docs/latest/rules/guard-for-in
   */
  'guard-for-in'?: Linter.RuleEntry<[]>
  /**
   * Require error handling in callbacks
   * @see https://eslint.org/docs/latest/rules/handle-callback-err
   * @deprecated
   */
  'handle-callback-err'?: Linter.RuleEntry<HandleCallbackErr>
  /**
   * Disallow specified identifiers
   * @see https://eslint.org/docs/latest/rules/id-blacklist
   * @deprecated
   */
  'id-blacklist'?: Linter.RuleEntry<IdBlacklist>
  /**
   * Disallow specified identifiers
   * @see https://eslint.org/docs/latest/rules/id-denylist
   */
  'id-denylist'?: Linter.RuleEntry<IdDenylist>
  /**
   * Enforce minimum and maximum identifier lengths
   * @see https://eslint.org/docs/latest/rules/id-length
   */
  'id-length'?: Linter.RuleEntry<IdLength>
  /**
   * Require identifiers to match a specified regular expression
   * @see https://eslint.org/docs/latest/rules/id-match
   */
  'id-match'?: Linter.RuleEntry<IdMatch>
  /**
   * Enforce the location of arrow function bodies
   * @see https://eslint.org/docs/latest/rules/implicit-arrow-linebreak
   * @deprecated
   */
  'implicit-arrow-linebreak'?: Linter.RuleEntry<ImplicitArrowLinebreak>
  /**
   * Enforce or ban the use of inline type-only markers for named imports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/consistent-type-specifier-style.md
   */
  'import-x/consistent-type-specifier-style'?: Linter.RuleEntry<ImportXConsistentTypeSpecifierStyle>
  /**
   * Ensure a default export is present, given a default import.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/default.md
   */
  'import-x/default'?: Linter.RuleEntry<[]>
  /**
   * Enforce a leading comment with the webpackChunkName for dynamic imports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/dynamic-import-chunkname.md
   */
  'import-x/dynamic-import-chunkname'?: Linter.RuleEntry<ImportXDynamicImportChunkname>
  /**
   * Forbid any invalid exports, i.e. re-export of the same name.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/export.md
   */
  'import-x/export'?: Linter.RuleEntry<[]>
  /**
   * Ensure all exports appear after other statements.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/exports-last.md
   */
  'import-x/exports-last'?: Linter.RuleEntry<[]>
  /**
   * Ensure consistent use of file extension within the import path.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/extensions.md
   */
  'import-x/extensions'?: Linter.RuleEntry<ImportXExtensions>
  /**
   * Ensure all imports appear before other statements.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/first.md
   */
  'import-x/first'?: Linter.RuleEntry<ImportXFirst>
  /**
   * Prefer named exports to be grouped together in a single export declaration.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/group-exports.md
   */
  'import-x/group-exports'?: Linter.RuleEntry<[]>
  /**
   * Replaced by `import-x/first`.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/imports-first.md
   * @deprecated
   */
  'import-x/imports-first'?: Linter.RuleEntry<ImportXImportsFirst>
  /**
   * Enforce the maximum number of dependencies a module can have.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/max-dependencies.md
   */
  'import-x/max-dependencies'?: Linter.RuleEntry<ImportXMaxDependencies>
  /**
   * Ensure named imports correspond to a named export in the remote file.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/named.md
   */
  'import-x/named'?: Linter.RuleEntry<ImportXNamed>
  /**
   * Ensure imported namespaces contain dereferenced properties as they are dereferenced.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/namespace.md
   */
  'import-x/namespace'?: Linter.RuleEntry<ImportXNamespace>
  /**
   * Enforce a newline after import statements.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/newline-after-import.md
   */
  'import-x/newline-after-import'?: Linter.RuleEntry<ImportXNewlineAfterImport>
  /**
   * Forbid import of modules using absolute paths.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-absolute-path.md
   */
  'import-x/no-absolute-path'?: Linter.RuleEntry<ImportXNoAbsolutePath>
  /**
   * Forbid AMD `require` and `define` calls.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-amd.md
   */
  'import-x/no-amd'?: Linter.RuleEntry<[]>
  /**
   * Forbid anonymous values as default exports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-anonymous-default-export.md
   */
  'import-x/no-anonymous-default-export'?: Linter.RuleEntry<ImportXNoAnonymousDefaultExport>
  /**
   * Forbid CommonJS `require` calls and `module.exports` or `exports.*`.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-commonjs.md
   */
  'import-x/no-commonjs'?: Linter.RuleEntry<ImportXNoCommonjs>
  /**
   * Forbid a module from importing a module with a dependency path back to itself.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-cycle.md
   */
  'import-x/no-cycle'?: Linter.RuleEntry<ImportXNoCycle>
  /**
   * Forbid default exports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-default-export.md
   */
  'import-x/no-default-export'?: Linter.RuleEntry<[]>
  /**
   * Forbid imported names marked with `@deprecated` documentation tag.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-deprecated.md
   */
  'import-x/no-deprecated'?: Linter.RuleEntry<[]>
  /**
   * Forbid repeated import of the same module in multiple places.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-duplicates.md
   */
  'import-x/no-duplicates'?: Linter.RuleEntry<ImportXNoDuplicates>
  /**
   * Forbid `require()` calls with expressions.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-dynamic-require.md
   */
  'import-x/no-dynamic-require'?: Linter.RuleEntry<ImportXNoDynamicRequire>
  /**
   * Forbid empty named import blocks.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-empty-named-blocks.md
   */
  'import-x/no-empty-named-blocks'?: Linter.RuleEntry<[]>
  /**
   * Forbid the use of extraneous packages.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-extraneous-dependencies.md
   */
  'import-x/no-extraneous-dependencies'?: Linter.RuleEntry<ImportXNoExtraneousDependencies>
  /**
   * Forbid import statements with CommonJS module.exports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-import-module-exports.md
   */
  'import-x/no-import-module-exports'?: Linter.RuleEntry<ImportXNoImportModuleExports>
  /**
   * Forbid importing the submodules of other modules.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-internal-modules.md
   */
  'import-x/no-internal-modules'?: Linter.RuleEntry<ImportXNoInternalModules>
  /**
   * Forbid the use of mutable exports with `var` or `let`.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-mutable-exports.md
   */
  'import-x/no-mutable-exports'?: Linter.RuleEntry<[]>
  /**
   * Forbid use of exported name as identifier of default export.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-named-as-default.md
   */
  'import-x/no-named-as-default'?: Linter.RuleEntry<[]>
  /**
   * Forbid use of exported name as property of default export.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-named-as-default-member.md
   */
  'import-x/no-named-as-default-member'?: Linter.RuleEntry<[]>
  /**
   * Forbid named default exports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-named-default.md
   */
  'import-x/no-named-default'?: Linter.RuleEntry<[]>
  /**
   * Forbid named exports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-named-export.md
   */
  'import-x/no-named-export'?: Linter.RuleEntry<[]>
  /**
   * Forbid namespace (a.k.a. "wildcard" `*`) imports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-namespace.md
   */
  'import-x/no-namespace'?: Linter.RuleEntry<ImportXNoNamespace>
  /**
   * Forbid Node.js builtin modules.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-nodejs-modules.md
   */
  'import-x/no-nodejs-modules'?: Linter.RuleEntry<ImportXNoNodejsModules>
  /**
   * Forbid importing packages through relative paths.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-relative-packages.md
   */
  'import-x/no-relative-packages'?: Linter.RuleEntry<ImportXNoRelativePackages>
  /**
   * Forbid importing modules from parent directories.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-relative-parent-imports.md
   */
  'import-x/no-relative-parent-imports'?: Linter.RuleEntry<ImportXNoRelativeParentImports>
  /**
   * Forbid importing a default export by a different name.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-rename-default.md
   */
  'import-x/no-rename-default'?: Linter.RuleEntry<ImportXNoRenameDefault>
  /**
   * Enforce which files can be imported in a given folder.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-restricted-paths.md
   */
  'import-x/no-restricted-paths'?: Linter.RuleEntry<ImportXNoRestrictedPaths>
  /**
   * Forbid a module from importing itself.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-self-import.md
   */
  'import-x/no-self-import'?: Linter.RuleEntry<[]>
  /**
   * Forbid unassigned imports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-unassigned-import.md
   */
  'import-x/no-unassigned-import'?: Linter.RuleEntry<ImportXNoUnassignedImport>
  /**
   * Ensure imports point to a file/module that can be resolved.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-unresolved.md
   */
  'import-x/no-unresolved'?: Linter.RuleEntry<ImportXNoUnresolved>
  /**
   * Forbid modules without exports, or exports without matching import in another module.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-unused-modules.md
   */
  'import-x/no-unused-modules'?: Linter.RuleEntry<ImportXNoUnusedModules>
  /**
   * Forbid unnecessary path segments in import and require statements.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-useless-path-segments.md
   */
  'import-x/no-useless-path-segments'?: Linter.RuleEntry<ImportXNoUselessPathSegments>
  /**
   * Forbid webpack loader syntax in imports.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/no-webpack-loader-syntax.md
   */
  'import-x/no-webpack-loader-syntax'?: Linter.RuleEntry<[]>
  /**
   * Enforce a convention in module import order.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/order.md
   */
  'import-x/order'?: Linter.RuleEntry<ImportXOrder>
  /**
   * Prefer a default export if module exports a single name or multiple names.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/prefer-default-export.md
   */
  'import-x/prefer-default-export'?: Linter.RuleEntry<ImportXPreferDefaultExport>
  /**
   * Enforce using namespace imports for specific modules, like `react`/`react-dom`, etc.
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/prefer-namespace-import.md
   */
  'import-x/prefer-namespace-import'?: Linter.RuleEntry<ImportXPreferNamespaceImport>
  /**
   * Forbid potentially ambiguous parse goal (`script` vs. `module`).
   * @see https://github.com/un-ts/eslint-plugin-import-x/blob/v4.17.1/docs/rules/unambiguous.md
   */
  'import-x/unambiguous'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent indentation
   * @see https://eslint.org/docs/latest/rules/indent
   * @deprecated
   */
  'indent'?: Linter.RuleEntry<Indent>
  /**
   * Enforce consistent indentation
   * @see https://eslint.org/docs/latest/rules/indent-legacy
   * @deprecated
   */
  'indent-legacy'?: Linter.RuleEntry<IndentLegacy>
  /**
   * Require or disallow initialization in variable declarations
   * @see https://eslint.org/docs/latest/rules/init-declarations
   */
  'init-declarations'?: Linter.RuleEntry<InitDeclarations>
  /**
   * Enforce `test` and `it` usage conventions
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/consistent-test-it.md
   */
  'jest/consistent-test-it'?: Linter.RuleEntry<JestConsistentTestIt>
  /**
   * Enforce assertion to be made in a test body
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/expect-expect.md
   */
  'jest/expect-expect'?: Linter.RuleEntry<JestExpectExpect>
  /**
   * Enforces a maximum number assertion calls in a test body
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/max-expects.md
   */
  'jest/max-expects'?: Linter.RuleEntry<JestMaxExpects>
  /**
   * Enforces a maximum depth to nested describe calls
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/max-nested-describe.md
   */
  'jest/max-nested-describe'?: Linter.RuleEntry<JestMaxNestedDescribe>
  /**
   * Disallow alias methods
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-alias-methods.md
   */
  'jest/no-alias-methods'?: Linter.RuleEntry<[]>
  /**
   * Disallow commented out tests
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-commented-out-tests.md
   */
  'jest/no-commented-out-tests'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling `expect` conditionally
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-conditional-expect.md
   */
  'jest/no-conditional-expect'?: Linter.RuleEntry<[]>
  /**
   * Disallow conditional logic in tests
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-conditional-in-test.md
   */
  'jest/no-conditional-in-test'?: Linter.RuleEntry<JestNoConditionalInTest>
  /**
   * Disallow confusing usages of jest.setTimeout
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-confusing-set-timeout.md
   */
  'jest/no-confusing-set-timeout'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of deprecated functions
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-deprecated-functions.md
   */
  'jest/no-deprecated-functions'?: Linter.RuleEntry<[]>
  /**
   * Disallow disabled tests
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-disabled-tests.md
   */
  'jest/no-disabled-tests'?: Linter.RuleEntry<[]>
  /**
   * Disallow using a callback in asynchronous tests and hooks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-done-callback.md
   */
  'jest/no-done-callback'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate setup and teardown hooks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-duplicate-hooks.md
   */
  'jest/no-duplicate-hooks'?: Linter.RuleEntry<[]>
  /**
   * Disallow using equality matchers on error types
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-error-equal.md
   */
  'jest/no-error-equal'?: Linter.RuleEntry<[]>
  /**
   * Disallow using `exports` in files containing tests
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-export.md
   */
  'jest/no-export'?: Linter.RuleEntry<[]>
  /**
   * Disallow focused tests
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-focused-tests.md
   */
  'jest/no-focused-tests'?: Linter.RuleEntry<[]>
  /**
   * Disallow setup and teardown hooks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-hooks.md
   */
  'jest/no-hooks'?: Linter.RuleEntry<JestNoHooks>
  /**
   * Disallow identical titles
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-identical-title.md
   */
  'jest/no-identical-title'?: Linter.RuleEntry<[]>
  /**
   * Disallow string interpolation inside snapshots
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-interpolation-in-snapshots.md
   */
  'jest/no-interpolation-in-snapshots'?: Linter.RuleEntry<[]>
  /**
   * Disallow Jasmine globals
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-jasmine-globals.md
   */
  'jest/no-jasmine-globals'?: Linter.RuleEntry<[]>
  /**
   * Disallow large snapshots
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-large-snapshots.md
   */
  'jest/no-large-snapshots'?: Linter.RuleEntry<JestNoLargeSnapshots>
  /**
   * Disallow manually importing from `__mocks__`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-mocks-import.md
   */
  'jest/no-mocks-import'?: Linter.RuleEntry<[]>
  /**
   * Disallow specific `jest.` methods
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-restricted-jest-methods.md
   */
  'jest/no-restricted-jest-methods'?: Linter.RuleEntry<JestNoRestrictedJestMethods>
  /**
   * Disallow specific matchers & modifiers
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-restricted-matchers.md
   */
  'jest/no-restricted-matchers'?: Linter.RuleEntry<JestNoRestrictedMatchers>
  /**
   * Disallow using `expect` outside of `it` or `test` blocks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-standalone-expect.md
   */
  'jest/no-standalone-expect'?: Linter.RuleEntry<JestNoStandaloneExpect>
  /**
   * Require using `.only` and `.skip` over `f` and `x`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-test-prefixes.md
   */
  'jest/no-test-prefixes'?: Linter.RuleEntry<[]>
  /**
   * Disallow explicitly returning from tests
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-test-return-statement.md
   */
  'jest/no-test-return-statement'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary assertions based on types
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-unnecessary-assertion.md
   */
  'jest/no-unnecessary-assertion'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary async function wrapper for expected promises
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-unneeded-async-expect-function.md
   */
  'jest/no-unneeded-async-expect-function'?: Linter.RuleEntry<[]>
  /**
   * Disallow using `jest.mock()` factories without an explicit type parameter
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/no-untyped-mock-factory.md
   */
  'jest/no-untyped-mock-factory'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `afterAll` blocks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/padding-around-after-all-blocks.md
   */
  'jest/padding-around-after-all-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `afterEach` blocks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/padding-around-after-each-blocks.md
   */
  'jest/padding-around-after-each-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around Jest functions
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/padding-around-all.md
   */
  'jest/padding-around-all'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `beforeAll` blocks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/padding-around-before-all-blocks.md
   */
  'jest/padding-around-before-all-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `beforeEach` blocks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/padding-around-before-each-blocks.md
   */
  'jest/padding-around-before-each-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `describe` blocks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/padding-around-describe-blocks.md
   */
  'jest/padding-around-describe-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `expect` groups
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/padding-around-expect-groups.md
   */
  'jest/padding-around-expect-groups'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `test` and `it` blocks
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/padding-around-test-blocks.md
   */
  'jest/padding-around-test-blocks'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toHaveBeenCalledWith()`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-called-with.md
   */
  'jest/prefer-called-with'?: Linter.RuleEntry<[]>
  /**
   * Suggest using the built-in comparison matchers
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-comparison-matcher.md
   */
  'jest/prefer-comparison-matcher'?: Linter.RuleEntry<[]>
  /**
   * Prefer using `.each` rather than manual loops
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-each.md
   */
  'jest/prefer-each'?: Linter.RuleEntry<[]>
  /**
   * Prefer having the last statement in a test be an assertion
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-ending-with-an-expect.md
   */
  'jest/prefer-ending-with-an-expect'?: Linter.RuleEntry<JestPreferEndingWithAnExpect>
  /**
   * Suggest using the built-in equality matchers
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-equality-matcher.md
   */
  'jest/prefer-equality-matcher'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `expect.assertions()` OR `expect.hasAssertions()`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-expect-assertions.md
   */
  'jest/prefer-expect-assertions'?: Linter.RuleEntry<JestPreferExpectAssertions>
  /**
   * Prefer `await expect(...).resolves` over `expect(await ...)` syntax
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-expect-resolves.md
   */
  'jest/prefer-expect-resolves'?: Linter.RuleEntry<[]>
  /**
   * Prefer having hooks in a consistent order
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-hooks-in-order.md
   */
  'jest/prefer-hooks-in-order'?: Linter.RuleEntry<[]>
  /**
   * Suggest having hooks before any test cases
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-hooks-on-top.md
   */
  'jest/prefer-hooks-on-top'?: Linter.RuleEntry<[]>
  /**
   * Prefer importing Jest globals
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-importing-jest-globals.md
   */
  'jest/prefer-importing-jest-globals'?: Linter.RuleEntry<JestPreferImportingJestGlobals>
  /**
   * Prefer `jest.mocked()` over `fn as jest.Mock`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-jest-mocked.md
   */
  'jest/prefer-jest-mocked'?: Linter.RuleEntry<[]>
  /**
   * Enforce lowercase test names
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-lowercase-title.md
   */
  'jest/prefer-lowercase-title'?: Linter.RuleEntry<JestPreferLowercaseTitle>
  /**
   * Prefer mock resolved/rejected shorthands for promises
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-mock-promise-shorthand.md
   */
  'jest/prefer-mock-promise-shorthand'?: Linter.RuleEntry<[]>
  /**
   * Prefer mock return shorthands
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-mock-return-shorthand.md
   */
  'jest/prefer-mock-return-shorthand'?: Linter.RuleEntry<[]>
  /**
   * Prefer including a hint with external snapshots
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-snapshot-hint.md
   */
  'jest/prefer-snapshot-hint'?: Linter.RuleEntry<JestPreferSnapshotHint>
  /**
   * Suggest using `jest.spyOn()`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-spy-on.md
   */
  'jest/prefer-spy-on'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toStrictEqual()`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-strict-equal.md
   */
  'jest/prefer-strict-equal'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toBe()` for primitive literals
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-to-be.md
   */
  'jest/prefer-to-be'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toContain()`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-to-contain.md
   */
  'jest/prefer-to-contain'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toHaveBeenCalled`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-to-have-been-called.md
   */
  'jest/prefer-to-have-been-called'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toHaveBeenCalledTimes()`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-to-have-been-called-times.md
   */
  'jest/prefer-to-have-been-called-times'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toHaveLength()`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-to-have-length.md
   */
  'jest/prefer-to-have-length'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `test.todo`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/prefer-todo.md
   */
  'jest/prefer-todo'?: Linter.RuleEntry<[]>
  /**
   * Require setup and teardown code to be within a hook
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/require-hook.md
   */
  'jest/require-hook'?: Linter.RuleEntry<JestRequireHook>
  /**
   * Require a message for `toThrow()`
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/require-to-throw-message.md
   */
  'jest/require-to-throw-message'?: Linter.RuleEntry<[]>
  /**
   * Require test cases and hooks to be inside a `describe` block
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/require-top-level-describe.md
   */
  'jest/require-top-level-describe'?: Linter.RuleEntry<JestRequireTopLevelDescribe>
  /**
   * Enforce unbound methods are called with their expected scope
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/unbound-method.md
   */
  'jest/unbound-method'?: Linter.RuleEntry<JestUnboundMethod>
  /**
   * Enforce valid `describe()` callback
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/valid-describe-callback.md
   */
  'jest/valid-describe-callback'?: Linter.RuleEntry<[]>
  /**
   * Enforce valid `expect()` usage
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/valid-expect.md
   */
  'jest/valid-expect'?: Linter.RuleEntry<JestValidExpect>
  /**
   * Require promises that have expectations in their chain to be valid
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/valid-expect-in-promise.md
   */
  'jest/valid-expect-in-promise'?: Linter.RuleEntry<[]>
  /**
   * Require that `resolve` and `reject` modifiers are present (and only) for promise-like types
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/valid-expect-with-promise.md
   */
  'jest/valid-expect-with-promise'?: Linter.RuleEntry<JestValidExpectWithPromise>
  /**
   * Disallow mocking of non-existing module paths
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/valid-mock-module-path.md
   */
  'jest/valid-mock-module-path'?: Linter.RuleEntry<JestValidMockModulePath>
  /**
   * Enforce valid titles
   * @see https://github.com/jest-community/eslint-plugin-jest/blob/v29.16.6/docs/rules/valid-title.md
   */
  'jest/valid-title'?: Linter.RuleEntry<JestValidTitle>
  /**
   * Enforce all elements that require alternative text have meaningful information to relay back to end user.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/alt-text.md
   */
  'jsx-a11y-x/alt-text'?: Linter.RuleEntry<JsxA11YXAltText>
  /**
   * Enforce `<a>` text to not exactly match "click here", "here", "link", or "a link".
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/anchor-ambiguous-text.md
   */
  'jsx-a11y-x/anchor-ambiguous-text'?: Linter.RuleEntry<JsxA11YXAnchorAmbiguousText>
  /**
   * Enforce all anchors to contain accessible content.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/anchor-has-content.md
   */
  'jsx-a11y-x/anchor-has-content'?: Linter.RuleEntry<JsxA11YXAnchorHasContent>
  /**
   * Enforce all anchors are valid, navigable elements.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/anchor-is-valid.md
   */
  'jsx-a11y-x/anchor-is-valid'?: Linter.RuleEntry<JsxA11YXAnchorIsValid>
  /**
   * Enforce elements with aria-activedescendant are tabbable.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/aria-activedescendant-has-tabindex.md
   */
  'jsx-a11y-x/aria-activedescendant-has-tabindex'?: Linter.RuleEntry<[]>
  /**
   * Enforce all `aria-*` props are valid.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/aria-props.md
   */
  'jsx-a11y-x/aria-props'?: Linter.RuleEntry<[]>
  /**
   * Enforce ARIA state and property values are valid.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/aria-proptypes.md
   */
  'jsx-a11y-x/aria-proptypes'?: Linter.RuleEntry<[]>
  /**
   * Enforce that elements with ARIA roles must use a valid, non-abstract ARIA role.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/aria-role.md
   */
  'jsx-a11y-x/aria-role'?: Linter.RuleEntry<JsxA11YXAriaRole>
  /**
   * Enforce that elements that do not support ARIA roles, states, and properties do not have those attributes.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/aria-unsupported-elements.md
   */
  'jsx-a11y-x/aria-unsupported-elements'?: Linter.RuleEntry<[]>
  /**
   * Enforce that autocomplete attributes are used correctly.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/autocomplete-valid.md
   */
  'jsx-a11y-x/autocomplete-valid'?: Linter.RuleEntry<JsxA11YXAutocompleteValid>
  /**
   * Enforce a clickable non-interactive element has at least one keyboard event listener.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/click-events-have-key-events.md
   */
  'jsx-a11y-x/click-events-have-key-events'?: Linter.RuleEntry<[]>
  /**
   * Enforce that a control (an interactive element) has a text label.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/control-has-associated-label.md
   */
  'jsx-a11y-x/control-has-associated-label'?: Linter.RuleEntry<JsxA11YXControlHasAssociatedLabel>
  /**
   * Enforce heading (`h1`, `h2`, etc) elements contain accessible content.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/heading-has-content.md
   */
  'jsx-a11y-x/heading-has-content'?: Linter.RuleEntry<JsxA11YXHeadingHasContent>
  /**
   * Enforce `<html>` element has `lang` prop.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/html-has-lang.md
   */
  'jsx-a11y-x/html-has-lang'?: Linter.RuleEntry<[]>
  /**
   * Enforce iframe elements have a title attribute.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/iframe-has-title.md
   */
  'jsx-a11y-x/iframe-has-title'?: Linter.RuleEntry<[]>
  /**
   * Enforce `<img>` alt prop does not contain the word "image", "picture", or "photo".
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/img-redundant-alt.md
   */
  'jsx-a11y-x/img-redundant-alt'?: Linter.RuleEntry<JsxA11YXImgRedundantAlt>
  /**
   * Enforce that elements with interactive handlers like `onClick` must be focusable.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/interactive-supports-focus.md
   */
  'jsx-a11y-x/interactive-supports-focus'?: Linter.RuleEntry<JsxA11YXInteractiveSupportsFocus>
  /**
   * Enforce that a `label` tag has a text label and an associated control.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/label-has-associated-control.md
   */
  'jsx-a11y-x/label-has-associated-control'?: Linter.RuleEntry<JsxA11YXLabelHasAssociatedControl>
  /**
   * Enforce lang attribute has a valid value.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/lang.md
   */
  'jsx-a11y-x/lang'?: Linter.RuleEntry<[]>
  /**
   * Enforces that `<audio>` and `<video>` elements must have a `<track>` for captions.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/media-has-caption.md
   */
  'jsx-a11y-x/media-has-caption'?: Linter.RuleEntry<JsxA11YXMediaHasCaption>
  /**
   * Enforce that `onMouseOver`/`onMouseOut` are accompanied by `onFocus`/`onBlur` for keyboard-only users.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/mouse-events-have-key-events.md
   */
  'jsx-a11y-x/mouse-events-have-key-events'?: Linter.RuleEntry<JsxA11YXMouseEventsHaveKeyEvents>
  /**
   * Enforce that the `accessKey` prop is not used on any element to avoid complications with keyboard commands used by a screen reader.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-access-key.md
   */
  'jsx-a11y-x/no-access-key'?: Linter.RuleEntry<[]>
  /**
   * Disallow `aria-hidden="true"` from being set on focusable elements.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-aria-hidden-on-focusable.md
   */
  'jsx-a11y-x/no-aria-hidden-on-focusable'?: Linter.RuleEntry<[]>
  /**
   * Enforce autoFocus prop is not enabled.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-autofocus.md
   */
  'jsx-a11y-x/no-autofocus'?: Linter.RuleEntry<JsxA11YXNoAutofocus>
  /**
   * Enforce distracting elements are not used.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-distracting-elements.md
   */
  'jsx-a11y-x/no-distracting-elements'?: Linter.RuleEntry<JsxA11YXNoDistractingElements>
  /**
   * Disallow interactive elements being assigned non-interactive roles.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-interactive-element-to-noninteractive-role.md
   */
  'jsx-a11y-x/no-interactive-element-to-noninteractive-role'?: Linter.RuleEntry<JsxA11YXNoInteractiveElementToNoninteractiveRole>
  /**
   * Disallow non-interactive elements being assigned mouse or keyboard event listeners.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-noninteractive-element-interactions.md
   */
  'jsx-a11y-x/no-noninteractive-element-interactions'?: Linter.RuleEntry<JsxA11YXNoNoninteractiveElementInteractions>
  /**
   * Disallow non-interactive elements being assigned interactive roles.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-noninteractive-element-to-interactive-role.md
   */
  'jsx-a11y-x/no-noninteractive-element-to-interactive-role'?: Linter.RuleEntry<JsxA11YXNoNoninteractiveElementToInteractiveRole>
  /**
   * Enforce `tabIndex` only be declared on interactive elements.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-noninteractive-tabindex.md
   */
  'jsx-a11y-x/no-noninteractive-tabindex'?: Linter.RuleEntry<JsxA11YXNoNoninteractiveTabindex>
  /**
   * Enforce explicit role property is not the same as implicit/default role property on element.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-redundant-roles.md
   */
  'jsx-a11y-x/no-redundant-roles'?: Linter.RuleEntry<JsxA11YXNoRedundantRoles>
  /**
   * Enforce that non-interactive, visible elements (such as `<div>`) that have click handlers use the role attribute.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/no-static-element-interactions.md
   */
  'jsx-a11y-x/no-static-element-interactions'?: Linter.RuleEntry<JsxA11YXNoStaticElementInteractions>
  /**
   * Enforces using semantic DOM elements over the ARIA `role` property.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/prefer-tag-over-role.md
   */
  'jsx-a11y-x/prefer-tag-over-role'?: Linter.RuleEntry<[]>
  /**
   * Enforce that elements with ARIA roles must have all required attributes for that role.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/role-has-required-aria-props.md
   */
  'jsx-a11y-x/role-has-required-aria-props'?: Linter.RuleEntry<[]>
  /**
   * Enforce that elements with explicit or implicit roles defined contain only `aria-*` properties supported by that `role`.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/role-supports-aria-props.md
   */
  'jsx-a11y-x/role-supports-aria-props'?: Linter.RuleEntry<[]>
  /**
   * Enforce `scope` prop is only used on `<th>` elements.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/scope.md
   */
  'jsx-a11y-x/scope'?: Linter.RuleEntry<[]>
  /**
   * Enforce `tabIndex` value is not greater than zero.
   * @see https://github.com/es-tooling/eslint-plugin-jsx-a11y-x/tree/HEAD/docs/rules/tabindex-no-positive.md
   */
  'jsx-a11y-x/tabindex-no-positive'?: Linter.RuleEntry<[]>
  /**
   * Enforce the consistent use of either double or single quotes in JSX attributes
   * @see https://eslint.org/docs/latest/rules/jsx-quotes
   * @deprecated
   */
  'jsx-quotes'?: Linter.RuleEntry<JsxQuotes>
  /**
   * Enforce consistent spacing between keys and values in object literal properties
   * @see https://eslint.org/docs/latest/rules/key-spacing
   * @deprecated
   */
  'key-spacing'?: Linter.RuleEntry<KeySpacing>
  /**
   * Enforce consistent spacing before and after keywords
   * @see https://eslint.org/docs/latest/rules/keyword-spacing
   * @deprecated
   */
  'keyword-spacing'?: Linter.RuleEntry<KeywordSpacing>
  /**
   * Enforce position of line comments
   * @see https://eslint.org/docs/latest/rules/line-comment-position
   * @deprecated
   */
  'line-comment-position'?: Linter.RuleEntry<LineCommentPosition>
  /**
   * Enforce consistent linebreak style
   * @see https://eslint.org/docs/latest/rules/linebreak-style
   * @deprecated
   */
  'linebreak-style'?: Linter.RuleEntry<LinebreakStyle>
  /**
   * Require empty lines around comments
   * @see https://eslint.org/docs/latest/rules/lines-around-comment
   * @deprecated
   */
  'lines-around-comment'?: Linter.RuleEntry<LinesAroundComment>
  /**
   * Require or disallow newlines around directives
   * @see https://eslint.org/docs/latest/rules/lines-around-directive
   * @deprecated
   */
  'lines-around-directive'?: Linter.RuleEntry<LinesAroundDirective>
  /**
   * Require or disallow an empty line between class members
   * @see https://eslint.org/docs/latest/rules/lines-between-class-members
   * @deprecated
   */
  'lines-between-class-members'?: Linter.RuleEntry<LinesBetweenClassMembers>
  /**
   * Require or disallow logical assignment operator shorthand
   * @see https://eslint.org/docs/latest/rules/logical-assignment-operators
   */
  'logical-assignment-operators'?: Linter.RuleEntry<LogicalAssignmentOperators>
  /**
   * Enforce a maximum number of classes per file
   * @see https://eslint.org/docs/latest/rules/max-classes-per-file
   */
  'max-classes-per-file'?: Linter.RuleEntry<MaxClassesPerFile>
  /**
   * Enforce a maximum depth that blocks can be nested
   * @see https://eslint.org/docs/latest/rules/max-depth
   */
  'max-depth'?: Linter.RuleEntry<MaxDepth>
  /**
   * Enforce a maximum line length
   * @see https://eslint.org/docs/latest/rules/max-len
   * @deprecated
   */
  'max-len'?: Linter.RuleEntry<MaxLen>
  /**
   * Enforce a maximum number of lines per file
   * @see https://eslint.org/docs/latest/rules/max-lines
   */
  'max-lines'?: Linter.RuleEntry<MaxLines>
  /**
   * Enforce a maximum number of lines of code in a function
   * @see https://eslint.org/docs/latest/rules/max-lines-per-function
   */
  'max-lines-per-function'?: Linter.RuleEntry<MaxLinesPerFunction>
  /**
   * Enforce a maximum depth that callbacks can be nested
   * @see https://eslint.org/docs/latest/rules/max-nested-callbacks
   */
  'max-nested-callbacks'?: Linter.RuleEntry<MaxNestedCallbacks>
  /**
   * Enforce a maximum number of parameters in function definitions
   * @see https://eslint.org/docs/latest/rules/max-params
   */
  'max-params'?: Linter.RuleEntry<MaxParams>
  /**
   * Enforce a maximum number of statements allowed in function blocks
   * @see https://eslint.org/docs/latest/rules/max-statements
   */
  'max-statements'?: Linter.RuleEntry<MaxStatements>
  /**
   * Enforce a maximum number of statements allowed per line
   * @see https://eslint.org/docs/latest/rules/max-statements-per-line
   * @deprecated
   */
  'max-statements-per-line'?: Linter.RuleEntry<MaxStatementsPerLine>
  /**
   * Enforce a particular style for multiline comments
   * @see https://eslint.org/docs/latest/rules/multiline-comment-style
   * @deprecated
   */
  'multiline-comment-style'?: Linter.RuleEntry<MultilineCommentStyle>
  /**
   * Enforce newlines between operands of ternary expressions
   * @see https://eslint.org/docs/latest/rules/multiline-ternary
   * @deprecated
   */
  'multiline-ternary'?: Linter.RuleEntry<MultilineTernary>
  /**
   * Require constructor names to begin with a capital letter
   * @see https://eslint.org/docs/latest/rules/new-cap
   */
  'new-cap'?: Linter.RuleEntry<NewCap>
  /**
   * Enforce or disallow parentheses when invoking a constructor with no arguments
   * @see https://eslint.org/docs/latest/rules/new-parens
   * @deprecated
   */
  'new-parens'?: Linter.RuleEntry<NewParens>
  /**
   * Require or disallow an empty line after variable declarations
   * @see https://eslint.org/docs/latest/rules/newline-after-var
   * @deprecated
   */
  'newline-after-var'?: Linter.RuleEntry<NewlineAfterVar>
  /**
   * Require an empty line before `return` statements
   * @see https://eslint.org/docs/latest/rules/newline-before-return
   * @deprecated
   */
  'newline-before-return'?: Linter.RuleEntry<[]>
  /**
   * Require a newline after each call in a method chain
   * @see https://eslint.org/docs/latest/rules/newline-per-chained-call
   * @deprecated
   */
  'newline-per-chained-call'?: Linter.RuleEntry<NewlinePerChainedCall>
  /**
   * Disallow the use of `alert`, `confirm`, and `prompt`
   * @see https://eslint.org/docs/latest/rules/no-alert
   */
  'no-alert'?: Linter.RuleEntry<[]>
  /**
   * Disallow `Array` constructors
   * @see https://eslint.org/docs/latest/rules/no-array-constructor
   */
  'no-array-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow using an async function as a Promise executor
   * @see https://eslint.org/docs/latest/rules/no-async-promise-executor
   */
  'no-async-promise-executor'?: Linter.RuleEntry<[]>
  /**
   * Disallow `await` inside of loops
   * @see https://eslint.org/docs/latest/rules/no-await-in-loop
   */
  'no-await-in-loop'?: Linter.RuleEntry<[]>
  /**
   * Disallow bitwise operators
   * @see https://eslint.org/docs/latest/rules/no-bitwise
   */
  'no-bitwise'?: Linter.RuleEntry<NoBitwise>
  /**
   * Disallow use of the `Buffer()` constructor
   * @see https://eslint.org/docs/latest/rules/no-buffer-constructor
   * @deprecated
   */
  'no-buffer-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `arguments.caller` or `arguments.callee`
   * @see https://eslint.org/docs/latest/rules/no-caller
   */
  'no-caller'?: Linter.RuleEntry<[]>
  /**
   * Disallow lexical declarations in case clauses
   * @see https://eslint.org/docs/latest/rules/no-case-declarations
   */
  'no-case-declarations'?: Linter.RuleEntry<[]>
  /**
   * Disallow `catch` clause parameters from shadowing variables in the outer scope
   * @see https://eslint.org/docs/latest/rules/no-catch-shadow
   * @deprecated
   */
  'no-catch-shadow'?: Linter.RuleEntry<[]>
  /**
   * Disallow reassigning class members
   * @see https://eslint.org/docs/latest/rules/no-class-assign
   */
  'no-class-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow comparing against `-0`
   * @see https://eslint.org/docs/latest/rules/no-compare-neg-zero
   */
  'no-compare-neg-zero'?: Linter.RuleEntry<[]>
  /**
   * Disallow assignment operators in conditional expressions
   * @see https://eslint.org/docs/latest/rules/no-cond-assign
   */
  'no-cond-assign'?: Linter.RuleEntry<NoCondAssign>
  /**
   * Disallow arrow functions where they could be confused with comparisons
   * @see https://eslint.org/docs/latest/rules/no-confusing-arrow
   * @deprecated
   */
  'no-confusing-arrow'?: Linter.RuleEntry<NoConfusingArrow>
  /**
   * Disallow the use of `console`
   * @see https://eslint.org/docs/latest/rules/no-console
   */
  'no-console'?: Linter.RuleEntry<NoConsole>
  /**
   * Disallow reassigning `const`, `using`, and `await using` variables
   * @see https://eslint.org/docs/latest/rules/no-const-assign
   */
  'no-const-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow expressions where the operation doesn't affect the value
   * @see https://eslint.org/docs/latest/rules/no-constant-binary-expression
   */
  'no-constant-binary-expression'?: Linter.RuleEntry<NoConstantBinaryExpression>
  /**
   * Disallow constant expressions in conditions
   * @see https://eslint.org/docs/latest/rules/no-constant-condition
   */
  'no-constant-condition'?: Linter.RuleEntry<NoConstantCondition>
  /**
   * Disallow returning value from constructor
   * @see https://eslint.org/docs/latest/rules/no-constructor-return
   */
  'no-constructor-return'?: Linter.RuleEntry<[]>
  /**
   * Disallow `continue` statements
   * @see https://eslint.org/docs/latest/rules/no-continue
   */
  'no-continue'?: Linter.RuleEntry<[]>
  /**
   * Disallow control characters in regular expressions
   * @see https://eslint.org/docs/latest/rules/no-control-regex
   */
  'no-control-regex'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `debugger`
   * @see https://eslint.org/docs/latest/rules/no-debugger
   */
  'no-debugger'?: Linter.RuleEntry<[]>
  /**
   * Disallow deleting variables
   * @see https://eslint.org/docs/latest/rules/no-delete-var
   */
  'no-delete-var'?: Linter.RuleEntry<[]>
  /**
   * Disallow equal signs explicitly at the beginning of regular expressions
   * @see https://eslint.org/docs/latest/rules/no-div-regex
   */
  'no-div-regex'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate arguments in `function` definitions
   * @see https://eslint.org/docs/latest/rules/no-dupe-args
   */
  'no-dupe-args'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate class members
   * @see https://eslint.org/docs/latest/rules/no-dupe-class-members
   */
  'no-dupe-class-members'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate conditions in if-else-if chains
   * @see https://eslint.org/docs/latest/rules/no-dupe-else-if
   */
  'no-dupe-else-if'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate keys in object literals
   * @see https://eslint.org/docs/latest/rules/no-dupe-keys
   */
  'no-dupe-keys'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate case labels
   * @see https://eslint.org/docs/latest/rules/no-duplicate-case
   */
  'no-duplicate-case'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate module imports
   * @see https://eslint.org/docs/latest/rules/no-duplicate-imports
   */
  'no-duplicate-imports'?: Linter.RuleEntry<NoDuplicateImports>
  /**
   * Disallow `else` blocks after `return` statements in `if` statements
   * @see https://eslint.org/docs/latest/rules/no-else-return
   */
  'no-else-return'?: Linter.RuleEntry<NoElseReturn>
  /**
   * Disallow empty block statements
   * @see https://eslint.org/docs/latest/rules/no-empty
   */
  'no-empty'?: Linter.RuleEntry<NoEmpty>
  /**
   * Disallow empty character classes in regular expressions
   * @see https://eslint.org/docs/latest/rules/no-empty-character-class
   */
  'no-empty-character-class'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty functions
   * @see https://eslint.org/docs/latest/rules/no-empty-function
   */
  'no-empty-function'?: Linter.RuleEntry<NoEmptyFunction>
  /**
   * Disallow empty destructuring patterns
   * @see https://eslint.org/docs/latest/rules/no-empty-pattern
   */
  'no-empty-pattern'?: Linter.RuleEntry<NoEmptyPattern>
  /**
   * Disallow empty static blocks
   * @see https://eslint.org/docs/latest/rules/no-empty-static-block
   */
  'no-empty-static-block'?: Linter.RuleEntry<[]>
  /**
   * Disallow `null` comparisons without type-checking operators
   * @see https://eslint.org/docs/latest/rules/no-eq-null
   */
  'no-eq-null'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `eval()`
   * @see https://eslint.org/docs/latest/rules/no-eval
   */
  'no-eval'?: Linter.RuleEntry<NoEval>
  /**
   * Disallow reassigning exceptions in `catch` clauses
   * @see https://eslint.org/docs/latest/rules/no-ex-assign
   */
  'no-ex-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow extending native types
   * @see https://eslint.org/docs/latest/rules/no-extend-native
   */
  'no-extend-native'?: Linter.RuleEntry<NoExtendNative>
  /**
   * Disallow unnecessary calls to `.bind()`
   * @see https://eslint.org/docs/latest/rules/no-extra-bind
   */
  'no-extra-bind'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary boolean casts
   * @see https://eslint.org/docs/latest/rules/no-extra-boolean-cast
   */
  'no-extra-boolean-cast'?: Linter.RuleEntry<NoExtraBooleanCast>
  /**
   * Disallow unnecessary labels
   * @see https://eslint.org/docs/latest/rules/no-extra-label
   */
  'no-extra-label'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary parentheses
   * @see https://eslint.org/docs/latest/rules/no-extra-parens
   * @deprecated
   */
  'no-extra-parens'?: Linter.RuleEntry<NoExtraParens>
  /**
   * Disallow unnecessary semicolons
   * @see https://eslint.org/docs/latest/rules/no-extra-semi
   * @deprecated
   */
  'no-extra-semi'?: Linter.RuleEntry<[]>
  /**
   * Disallow fallthrough of `case` statements
   * @see https://eslint.org/docs/latest/rules/no-fallthrough
   */
  'no-fallthrough'?: Linter.RuleEntry<NoFallthrough>
  /**
   * Disallow leading or trailing decimal points in numeric literals
   * @see https://eslint.org/docs/latest/rules/no-floating-decimal
   * @deprecated
   */
  'no-floating-decimal'?: Linter.RuleEntry<[]>
  /**
   * Disallow reassigning `function` declarations
   * @see https://eslint.org/docs/latest/rules/no-func-assign
   */
  'no-func-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow assignments to native objects or read-only global variables
   * @see https://eslint.org/docs/latest/rules/no-global-assign
   */
  'no-global-assign'?: Linter.RuleEntry<NoGlobalAssign>
  /**
   * Disallow shorthand type conversions
   * @see https://eslint.org/docs/latest/rules/no-implicit-coercion
   */
  'no-implicit-coercion'?: Linter.RuleEntry<NoImplicitCoercion>
  /**
   * Disallow declarations in the global scope
   * @see https://eslint.org/docs/latest/rules/no-implicit-globals
   */
  'no-implicit-globals'?: Linter.RuleEntry<NoImplicitGlobals>
  /**
   * Disallow the use of `eval()`-like methods
   * @see https://eslint.org/docs/latest/rules/no-implied-eval
   */
  'no-implied-eval'?: Linter.RuleEntry<[]>
  /**
   * Disallow assigning to imported bindings
   * @see https://eslint.org/docs/latest/rules/no-import-assign
   */
  'no-import-assign'?: Linter.RuleEntry<[]>
  /**
   * Disallow inline comments after code
   * @see https://eslint.org/docs/latest/rules/no-inline-comments
   */
  'no-inline-comments'?: Linter.RuleEntry<NoInlineComments>
  /**
   * Disallow variable or `function` declarations in nested blocks
   * @see https://eslint.org/docs/latest/rules/no-inner-declarations
   */
  'no-inner-declarations'?: Linter.RuleEntry<NoInnerDeclarations>
  /**
   * Disallow invalid regular expression strings in `RegExp` constructors
   * @see https://eslint.org/docs/latest/rules/no-invalid-regexp
   */
  'no-invalid-regexp'?: Linter.RuleEntry<NoInvalidRegexp>
  /**
   * Disallow use of `this` in contexts where the value of `this` is `undefined`
   * @see https://eslint.org/docs/latest/rules/no-invalid-this
   */
  'no-invalid-this'?: Linter.RuleEntry<NoInvalidThis>
  /**
   * Disallow irregular whitespace
   * @see https://eslint.org/docs/latest/rules/no-irregular-whitespace
   */
  'no-irregular-whitespace'?: Linter.RuleEntry<NoIrregularWhitespace>
  /**
   * Disallow the use of the `__iterator__` property
   * @see https://eslint.org/docs/latest/rules/no-iterator
   */
  'no-iterator'?: Linter.RuleEntry<[]>
  /**
   * Disallow labels that share a name with a variable
   * @see https://eslint.org/docs/latest/rules/no-label-var
   */
  'no-label-var'?: Linter.RuleEntry<[]>
  /**
   * Disallow labeled statements
   * @see https://eslint.org/docs/latest/rules/no-labels
   */
  'no-labels'?: Linter.RuleEntry<NoLabels>
  /**
   * Disallow unnecessary nested blocks
   * @see https://eslint.org/docs/latest/rules/no-lone-blocks
   */
  'no-lone-blocks'?: Linter.RuleEntry<[]>
  /**
   * Disallow `if` statements as the only statement in `else` blocks
   * @see https://eslint.org/docs/latest/rules/no-lonely-if
   */
  'no-lonely-if'?: Linter.RuleEntry<[]>
  /**
   * Disallow function declarations that contain unsafe references inside loop statements
   * @see https://eslint.org/docs/latest/rules/no-loop-func
   */
  'no-loop-func'?: Linter.RuleEntry<[]>
  /**
   * Disallow literal numbers that lose precision
   * @see https://eslint.org/docs/latest/rules/no-loss-of-precision
   */
  'no-loss-of-precision'?: Linter.RuleEntry<[]>
  /**
   * Disallow magic numbers
   * @see https://eslint.org/docs/latest/rules/no-magic-numbers
   */
  'no-magic-numbers'?: Linter.RuleEntry<NoMagicNumbers>
  /**
   * Disallow characters which are made with multiple code points in character class syntax
   * @see https://eslint.org/docs/latest/rules/no-misleading-character-class
   */
  'no-misleading-character-class'?: Linter.RuleEntry<NoMisleadingCharacterClass>
  /**
   * Disallow mixed binary operators
   * @see https://eslint.org/docs/latest/rules/no-mixed-operators
   * @deprecated
   */
  'no-mixed-operators'?: Linter.RuleEntry<NoMixedOperators>
  /**
   * Disallow `require` calls to be mixed with regular variable declarations
   * @see https://eslint.org/docs/latest/rules/no-mixed-requires
   * @deprecated
   */
  'no-mixed-requires'?: Linter.RuleEntry<NoMixedRequires>
  /**
   * Disallow mixed spaces and tabs for indentation
   * @see https://eslint.org/docs/latest/rules/no-mixed-spaces-and-tabs
   * @deprecated
   */
  'no-mixed-spaces-and-tabs'?: Linter.RuleEntry<NoMixedSpacesAndTabs>
  /**
   * Disallow use of chained assignment expressions
   * @see https://eslint.org/docs/latest/rules/no-multi-assign
   */
  'no-multi-assign'?: Linter.RuleEntry<NoMultiAssign>
  /**
   * Disallow multiple spaces
   * @see https://eslint.org/docs/latest/rules/no-multi-spaces
   * @deprecated
   */
  'no-multi-spaces'?: Linter.RuleEntry<NoMultiSpaces>
  /**
   * Disallow multiline strings
   * @see https://eslint.org/docs/latest/rules/no-multi-str
   */
  'no-multi-str'?: Linter.RuleEntry<[]>
  /**
   * Disallow multiple empty lines
   * @see https://eslint.org/docs/latest/rules/no-multiple-empty-lines
   * @deprecated
   */
  'no-multiple-empty-lines'?: Linter.RuleEntry<NoMultipleEmptyLines>
  /**
   * Disallow assignments to native objects or read-only global variables
   * @see https://eslint.org/docs/latest/rules/no-native-reassign
   * @deprecated
   */
  'no-native-reassign'?: Linter.RuleEntry<NoNativeReassign>
  /**
   * Disallow negated conditions
   * @see https://eslint.org/docs/latest/rules/no-negated-condition
   */
  'no-negated-condition'?: Linter.RuleEntry<[]>
  /**
   * Disallow negating the left operand in `in` expressions
   * @see https://eslint.org/docs/latest/rules/no-negated-in-lhs
   * @deprecated
   */
  'no-negated-in-lhs'?: Linter.RuleEntry<[]>
  /**
   * Disallow nested ternary expressions
   * @see https://eslint.org/docs/latest/rules/no-nested-ternary
   */
  'no-nested-ternary'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators outside of assignments or comparisons
   * @see https://eslint.org/docs/latest/rules/no-new
   */
  'no-new'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with the `Function` object
   * @see https://eslint.org/docs/latest/rules/no-new-func
   */
  'no-new-func'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with global non-constructor functions
   * @see https://eslint.org/docs/latest/rules/no-new-native-nonconstructor
   */
  'no-new-native-nonconstructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow `Object` constructors
   * @see https://eslint.org/docs/latest/rules/no-new-object
   * @deprecated
   */
  'no-new-object'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with calls to `require`
   * @see https://eslint.org/docs/latest/rules/no-new-require
   * @deprecated
   */
  'no-new-require'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with the `Symbol` object
   * @see https://eslint.org/docs/latest/rules/no-new-symbol
   * @deprecated
   */
  'no-new-symbol'?: Linter.RuleEntry<[]>
  /**
   * Disallow `new` operators with the `String`, `Number`, and `Boolean` objects
   * @see https://eslint.org/docs/latest/rules/no-new-wrappers
   */
  'no-new-wrappers'?: Linter.RuleEntry<[]>
  /**
   * Disallow `\8` and `\9` escape sequences in string literals
   * @see https://eslint.org/docs/latest/rules/no-nonoctal-decimal-escape
   */
  'no-nonoctal-decimal-escape'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling global object properties as functions
   * @see https://eslint.org/docs/latest/rules/no-obj-calls
   */
  'no-obj-calls'?: Linter.RuleEntry<[]>
  /**
   * Disallow calls to the `Object` constructor without an argument
   * @see https://eslint.org/docs/latest/rules/no-object-constructor
   */
  'no-object-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow octal literals
   * @see https://eslint.org/docs/latest/rules/no-octal
   */
  'no-octal'?: Linter.RuleEntry<[]>
  /**
   * Disallow octal escape sequences in string literals
   * @see https://eslint.org/docs/latest/rules/no-octal-escape
   */
  'no-octal-escape'?: Linter.RuleEntry<[]>
  /**
   * Disallow reassigning function parameters
   * @see https://eslint.org/docs/latest/rules/no-param-reassign
   */
  'no-param-reassign'?: Linter.RuleEntry<NoParamReassign>
  /**
   * Disallow string concatenation with `__dirname` and `__filename`
   * @see https://eslint.org/docs/latest/rules/no-path-concat
   * @deprecated
   */
  'no-path-concat'?: Linter.RuleEntry<[]>
  /**
   * Disallow the unary operators `++` and `--`
   * @see https://eslint.org/docs/latest/rules/no-plusplus
   */
  'no-plusplus'?: Linter.RuleEntry<NoPlusplus>
  /**
   * Disallow the use of `process.env`
   * @see https://eslint.org/docs/latest/rules/no-process-env
   * @deprecated
   */
  'no-process-env'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `process.exit()`
   * @see https://eslint.org/docs/latest/rules/no-process-exit
   * @deprecated
   */
  'no-process-exit'?: Linter.RuleEntry<[]>
  /**
   * Disallow returning values from Promise executor functions
   * @see https://eslint.org/docs/latest/rules/no-promise-executor-return
   */
  'no-promise-executor-return'?: Linter.RuleEntry<NoPromiseExecutorReturn>
  /**
   * Disallow the use of the `__proto__` property
   * @see https://eslint.org/docs/latest/rules/no-proto
   */
  'no-proto'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling some `Object.prototype` methods directly on objects
   * @see https://eslint.org/docs/latest/rules/no-prototype-builtins
   */
  'no-prototype-builtins'?: Linter.RuleEntry<[]>
  /**
   * Disallow variable redeclaration
   * @see https://eslint.org/docs/latest/rules/no-redeclare
   */
  'no-redeclare'?: Linter.RuleEntry<NoRedeclare>
  /**
   * Disallow multiple spaces in regular expressions
   * @see https://eslint.org/docs/latest/rules/no-regex-spaces
   */
  'no-regex-spaces'?: Linter.RuleEntry<[]>
  /**
   * Disallow specified names in exports
   * @see https://eslint.org/docs/latest/rules/no-restricted-exports
   */
  'no-restricted-exports'?: Linter.RuleEntry<NoRestrictedExports>
  /**
   * Disallow specified global variables
   * @see https://eslint.org/docs/latest/rules/no-restricted-globals
   */
  'no-restricted-globals'?: Linter.RuleEntry<NoRestrictedGlobals>
  /**
   * Disallow specified modules when loaded by `import`
   * @see https://eslint.org/docs/latest/rules/no-restricted-imports
   */
  'no-restricted-imports'?: Linter.RuleEntry<NoRestrictedImports>
  /**
   * Disallow specified modules when loaded by `require`
   * @see https://eslint.org/docs/latest/rules/no-restricted-modules
   * @deprecated
   */
  'no-restricted-modules'?: Linter.RuleEntry<NoRestrictedModules>
  /**
   * Disallow certain properties on certain objects
   * @see https://eslint.org/docs/latest/rules/no-restricted-properties
   */
  'no-restricted-properties'?: Linter.RuleEntry<NoRestrictedProperties>
  /**
   * Disallow specified syntax
   * @see https://eslint.org/docs/latest/rules/no-restricted-syntax
   */
  'no-restricted-syntax'?: Linter.RuleEntry<NoRestrictedSyntax>
  /**
   * Disallow assignment operators in `return` statements
   * @see https://eslint.org/docs/latest/rules/no-return-assign
   */
  'no-return-assign'?: Linter.RuleEntry<NoReturnAssign>
  /**
   * Disallow unnecessary `return await`
   * @see https://eslint.org/docs/latest/rules/no-return-await
   * @deprecated
   */
  'no-return-await'?: Linter.RuleEntry<[]>
  /**
   * Disallow `javascript:` URLs
   * @see https://eslint.org/docs/latest/rules/no-script-url
   */
  'no-script-url'?: Linter.RuleEntry<[]>
  /**
   * Disallow assignments where both sides are exactly the same
   * @see https://eslint.org/docs/latest/rules/no-self-assign
   */
  'no-self-assign'?: Linter.RuleEntry<NoSelfAssign>
  /**
   * Disallow comparisons where both sides are exactly the same
   * @see https://eslint.org/docs/latest/rules/no-self-compare
   */
  'no-self-compare'?: Linter.RuleEntry<[]>
  /**
   * Disallow comma operators
   * @see https://eslint.org/docs/latest/rules/no-sequences
   */
  'no-sequences'?: Linter.RuleEntry<NoSequences>
  /**
   * Disallow returning values from setters
   * @see https://eslint.org/docs/latest/rules/no-setter-return
   */
  'no-setter-return'?: Linter.RuleEntry<[]>
  /**
   * Disallow variable declarations from shadowing variables declared in the outer scope
   * @see https://eslint.org/docs/latest/rules/no-shadow
   */
  'no-shadow'?: Linter.RuleEntry<NoShadow>
  /**
   * Disallow identifiers from shadowing restricted names
   * @see https://eslint.org/docs/latest/rules/no-shadow-restricted-names
   */
  'no-shadow-restricted-names'?: Linter.RuleEntry<NoShadowRestrictedNames>
  /**
   * Disallow spacing between function identifiers and their applications (deprecated)
   * @see https://eslint.org/docs/latest/rules/no-spaced-func
   * @deprecated
   */
  'no-spaced-func'?: Linter.RuleEntry<[]>
  /**
   * Disallow sparse arrays
   * @see https://eslint.org/docs/latest/rules/no-sparse-arrays
   */
  'no-sparse-arrays'?: Linter.RuleEntry<[]>
  /**
   * Disallow synchronous methods
   * @see https://eslint.org/docs/latest/rules/no-sync
   * @deprecated
   */
  'no-sync'?: Linter.RuleEntry<NoSync>
  /**
   * Disallow all tabs
   * @see https://eslint.org/docs/latest/rules/no-tabs
   * @deprecated
   */
  'no-tabs'?: Linter.RuleEntry<NoTabs>
  /**
   * Disallow template literal placeholder syntax in regular strings
   * @see https://eslint.org/docs/latest/rules/no-template-curly-in-string
   */
  'no-template-curly-in-string'?: Linter.RuleEntry<[]>
  /**
   * Disallow ternary operators
   * @see https://eslint.org/docs/latest/rules/no-ternary
   */
  'no-ternary'?: Linter.RuleEntry<[]>
  /**
   * Disallow `this`/`super` before calling `super()` in constructors
   * @see https://eslint.org/docs/latest/rules/no-this-before-super
   */
  'no-this-before-super'?: Linter.RuleEntry<[]>
  /**
   * Disallow throwing literals as exceptions
   * @see https://eslint.org/docs/latest/rules/no-throw-literal
   */
  'no-throw-literal'?: Linter.RuleEntry<[]>
  /**
   * Disallow trailing whitespace at the end of lines
   * @see https://eslint.org/docs/latest/rules/no-trailing-spaces
   * @deprecated
   */
  'no-trailing-spaces'?: Linter.RuleEntry<NoTrailingSpaces>
  /**
   * Disallow `let` or `var` variables that are read but never assigned
   * @see https://eslint.org/docs/latest/rules/no-unassigned-vars
   */
  'no-unassigned-vars'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of undeclared variables unless mentioned in `/*global *\/` comments
   * @see https://eslint.org/docs/latest/rules/no-undef
   */
  'no-undef'?: Linter.RuleEntry<NoUndef>
  /**
   * Disallow initializing variables to `undefined`
   * @see https://eslint.org/docs/latest/rules/no-undef-init
   */
  'no-undef-init'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `undefined` as an identifier
   * @see https://eslint.org/docs/latest/rules/no-undefined
   */
  'no-undefined'?: Linter.RuleEntry<[]>
  /**
   * Disallow dangling underscores in identifiers
   * @see https://eslint.org/docs/latest/rules/no-underscore-dangle
   */
  'no-underscore-dangle'?: Linter.RuleEntry<NoUnderscoreDangle>
  /**
   * Disallow confusing multiline expressions
   * @see https://eslint.org/docs/latest/rules/no-unexpected-multiline
   */
  'no-unexpected-multiline'?: Linter.RuleEntry<[]>
  /**
   * Disallow unmodified loop conditions
   * @see https://eslint.org/docs/latest/rules/no-unmodified-loop-condition
   */
  'no-unmodified-loop-condition'?: Linter.RuleEntry<NoUnmodifiedLoopCondition>
  /**
   * Disallow ternary operators when simpler alternatives exist
   * @see https://eslint.org/docs/latest/rules/no-unneeded-ternary
   */
  'no-unneeded-ternary'?: Linter.RuleEntry<NoUnneededTernary>
  /**
   * Disallow unreachable code after `return`, `throw`, `continue`, and `break` statements
   * @see https://eslint.org/docs/latest/rules/no-unreachable
   */
  'no-unreachable'?: Linter.RuleEntry<[]>
  /**
   * Disallow loops with a body that allows only one iteration
   * @see https://eslint.org/docs/latest/rules/no-unreachable-loop
   */
  'no-unreachable-loop'?: Linter.RuleEntry<NoUnreachableLoop>
  /**
   * Disallow control flow statements in `finally` blocks
   * @see https://eslint.org/docs/latest/rules/no-unsafe-finally
   */
  'no-unsafe-finally'?: Linter.RuleEntry<[]>
  /**
   * Disallow negating the left operand of relational operators
   * @see https://eslint.org/docs/latest/rules/no-unsafe-negation
   */
  'no-unsafe-negation'?: Linter.RuleEntry<NoUnsafeNegation>
  /**
   * Disallow use of optional chaining in contexts where the `undefined` value is not allowed
   * @see https://eslint.org/docs/latest/rules/no-unsafe-optional-chaining
   */
  'no-unsafe-optional-chaining'?: Linter.RuleEntry<NoUnsafeOptionalChaining>
  /**
   * Disallow unused expressions
   * @see https://eslint.org/docs/latest/rules/no-unused-expressions
   */
  'no-unused-expressions'?: Linter.RuleEntry<NoUnusedExpressions>
  /**
   * Disallow unused labels
   * @see https://eslint.org/docs/latest/rules/no-unused-labels
   */
  'no-unused-labels'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused private class members
   * @see https://eslint.org/docs/latest/rules/no-unused-private-class-members
   */
  'no-unused-private-class-members'?: Linter.RuleEntry<[]>
  /**
   * Disallow unused variables
   * @see https://eslint.org/docs/latest/rules/no-unused-vars
   */
  'no-unused-vars'?: Linter.RuleEntry<NoUnusedVars>
  /**
   * Disallow the use of variables before they are defined
   * @see https://eslint.org/docs/latest/rules/no-use-before-define
   */
  'no-use-before-define'?: Linter.RuleEntry<NoUseBeforeDefine>
  /**
   * Disallow variable assignments when the value is not used
   * @see https://eslint.org/docs/latest/rules/no-useless-assignment
   */
  'no-useless-assignment'?: Linter.RuleEntry<[]>
  /**
   * Disallow useless backreferences in regular expressions
   * @see https://eslint.org/docs/latest/rules/no-useless-backreference
   */
  'no-useless-backreference'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary calls to `.call()` and `.apply()`
   * @see https://eslint.org/docs/latest/rules/no-useless-call
   */
  'no-useless-call'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary `catch` clauses
   * @see https://eslint.org/docs/latest/rules/no-useless-catch
   */
  'no-useless-catch'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary computed property keys in objects and classes
   * @see https://eslint.org/docs/latest/rules/no-useless-computed-key
   */
  'no-useless-computed-key'?: Linter.RuleEntry<NoUselessComputedKey>
  /**
   * Disallow unnecessary concatenation of literals or template literals
   * @see https://eslint.org/docs/latest/rules/no-useless-concat
   */
  'no-useless-concat'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary constructors
   * @see https://eslint.org/docs/latest/rules/no-useless-constructor
   */
  'no-useless-constructor'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary escape characters
   * @see https://eslint.org/docs/latest/rules/no-useless-escape
   */
  'no-useless-escape'?: Linter.RuleEntry<NoUselessEscape>
  /**
   * Disallow renaming import, export, and destructured assignments to the same name
   * @see https://eslint.org/docs/latest/rules/no-useless-rename
   */
  'no-useless-rename'?: Linter.RuleEntry<NoUselessRename>
  /**
   * Disallow redundant return statements
   * @see https://eslint.org/docs/latest/rules/no-useless-return
   */
  'no-useless-return'?: Linter.RuleEntry<[]>
  /**
   * Require `let` or `const` instead of `var`
   * @see https://eslint.org/docs/latest/rules/no-var
   */
  'no-var'?: Linter.RuleEntry<[]>
  /**
   * Disallow `void` operators
   * @see https://eslint.org/docs/latest/rules/no-void
   */
  'no-void'?: Linter.RuleEntry<NoVoid>
  /**
   * Disallow specified warning terms in comments
   * @see https://eslint.org/docs/latest/rules/no-warning-comments
   */
  'no-warning-comments'?: Linter.RuleEntry<NoWarningComments>
  /**
   * Disallow whitespace before properties
   * @see https://eslint.org/docs/latest/rules/no-whitespace-before-property
   * @deprecated
   */
  'no-whitespace-before-property'?: Linter.RuleEntry<[]>
  /**
   * Disallow `with` statements
   * @see https://eslint.org/docs/latest/rules/no-with
   */
  'no-with'?: Linter.RuleEntry<[]>
  /**
   * Enforce the location of single-line statements
   * @see https://eslint.org/docs/latest/rules/nonblock-statement-body-position
   * @deprecated
   */
  'nonblock-statement-body-position'?: Linter.RuleEntry<NonblockStatementBodyPosition>
  /**
   * Enforce consistent line breaks after opening and before closing braces
   * @see https://eslint.org/docs/latest/rules/object-curly-newline
   * @deprecated
   */
  'object-curly-newline'?: Linter.RuleEntry<ObjectCurlyNewline>
  /**
   * Enforce consistent spacing inside braces
   * @see https://eslint.org/docs/latest/rules/object-curly-spacing
   * @deprecated
   */
  'object-curly-spacing'?: Linter.RuleEntry<ObjectCurlySpacing>
  /**
   * Enforce placing object properties on separate lines
   * @see https://eslint.org/docs/latest/rules/object-property-newline
   * @deprecated
   */
  'object-property-newline'?: Linter.RuleEntry<ObjectPropertyNewline>
  /**
   * Require or disallow method and property shorthand syntax for object literals
   * @see https://eslint.org/docs/latest/rules/object-shorthand
   */
  'object-shorthand'?: Linter.RuleEntry<ObjectShorthand>
  /**
   * Enforce variables to be declared either together or separately in functions
   * @see https://eslint.org/docs/latest/rules/one-var
   */
  'one-var'?: Linter.RuleEntry<OneVar>
  /**
   * Require or disallow newlines around variable declarations
   * @see https://eslint.org/docs/latest/rules/one-var-declaration-per-line
   * @deprecated
   */
  'one-var-declaration-per-line'?: Linter.RuleEntry<OneVarDeclarationPerLine>
  /**
   * Require or disallow assignment operator shorthand where possible
   * @see https://eslint.org/docs/latest/rules/operator-assignment
   */
  'operator-assignment'?: Linter.RuleEntry<OperatorAssignment>
  /**
   * Enforce consistent linebreak style for operators
   * @see https://eslint.org/docs/latest/rules/operator-linebreak
   * @deprecated
   */
  'operator-linebreak'?: Linter.RuleEntry<OperatorLinebreak>
  /**
   * Require or disallow padding within blocks
   * @see https://eslint.org/docs/latest/rules/padded-blocks
   * @deprecated
   */
  'padded-blocks'?: Linter.RuleEntry<PaddedBlocks>
  /**
   * Require or disallow padding lines between statements
   * @see https://eslint.org/docs/latest/rules/padding-line-between-statements
   * @deprecated
   */
  'padding-line-between-statements'?: Linter.RuleEntry<PaddingLineBetweenStatements>
  /**
   * Enforces a blank line between Playwright test blocks (e.g., test, test.step, test.beforeEach, etc.).
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/consistent-spacing-between-blocks.md
   */
  'playwright/consistent-spacing-between-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce assertion to be made in a test body
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/expect-expect.md
   */
  'playwright/expect-expect'?: Linter.RuleEntry<PlaywrightExpectExpect>
  /**
   * Enforces a maximum number assertion calls in a test body
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/max-expects.md
   */
  'playwright/max-expects'?: Linter.RuleEntry<PlaywrightMaxExpects>
  /**
   * Enforces a maximum depth to nested describe calls
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/max-nested-describe.md
   */
  'playwright/max-nested-describe'?: Linter.RuleEntry<PlaywrightMaxNestedDescribe>
  /**
   * Identify false positives when async Playwright APIs are not properly awaited.
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/missing-playwright-await.md
   */
  'playwright/missing-playwright-await'?: Linter.RuleEntry<PlaywrightMissingPlaywrightAwait>
  /**
   * Disallow the `timeout` option on actions
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-action-timeout.md
   */
  'playwright/no-action-timeout'?: Linter.RuleEntry<PlaywrightNoActionTimeout>
  /**
   * Disallow commented out tests
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-commented-out-tests.md
   */
  'playwright/no-commented-out-tests'?: Linter.RuleEntry<[]>
  /**
   * Disallow calling `expect` conditionally
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-conditional-expect.md
   */
  'playwright/no-conditional-expect'?: Linter.RuleEntry<[]>
  /**
   * Disallow conditional logic in tests
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-conditional-in-test.md
   */
  'playwright/no-conditional-in-test'?: Linter.RuleEntry<[]>
  /**
   * Disallow duplicate setup and teardown hooks
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-duplicate-hooks.md
   */
  'playwright/no-duplicate-hooks'?: Linter.RuleEntry<[]>
  /**
   * Disallow multiple `test.slow()` calls in the same test
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-duplicate-slow.md
   */
  'playwright/no-duplicate-slow'?: Linter.RuleEntry<[]>
  /**
   * The use of ElementHandle is discouraged, use Locator instead
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-element-handle.md
   */
  'playwright/no-element-handle'?: Linter.RuleEntry<[]>
  /**
   * The use of `page.$eval` and `page.$$eval` are discouraged, use `locator.evaluate` or `locator.evaluateAll` instead
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-eval.md
   */
  'playwright/no-eval'?: Linter.RuleEntry<[]>
  /**
   * Disallow using `export` in files containing tests
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-export.md
   */
  'playwright/no-export'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `.only()` focus test annotation
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-focused-test.md
   */
  'playwright/no-focused-test'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of `{ force: true }` option.
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-force-option.md
   */
  'playwright/no-force-option'?: Linter.RuleEntry<[]>
  /**
   * Disallows the usage of getByTitle()
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-get-by-title.md
   */
  'playwright/no-get-by-title'?: Linter.RuleEntry<[]>
  /**
   * Disallow setup and teardown hooks
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-hooks.md
   */
  'playwright/no-hooks'?: Linter.RuleEntry<PlaywrightNoHooks>
  /**
   * Disallow identical titles
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-identical-title.md
   */
  'playwright/no-identical-title'?: Linter.RuleEntry<[]>
  /**
   * Disallow magic numbers as Playwright timeout values
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-magic-timeouts.md
   */
  'playwright/no-magic-timeouts'?: Linter.RuleEntry<PlaywrightNoMagicTimeouts>
  /**
   * Disallow nested `test.step()` methods
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-nested-step.md
   */
  'playwright/no-nested-step'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of the networkidle option
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-networkidle.md
   */
  'playwright/no-networkidle'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of nth methods
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-nth-methods.md
   */
  'playwright/no-nth-methods'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of page.pause()
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-page-pause.md
   */
  'playwright/no-page-pause'?: Linter.RuleEntry<[]>
  /**
   * Disallows the usage of raw locators
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-raw-locators.md
   */
  'playwright/no-raw-locators'?: Linter.RuleEntry<PlaywrightNoRawLocators>
  /**
   * Disallows the usage of specific locator methods
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-restricted-locators.md
   */
  'playwright/no-restricted-locators'?: Linter.RuleEntry<PlaywrightNoRestrictedLocators>
  /**
   * Disallow specific matchers & modifiers
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-restricted-matchers.md
   */
  'playwright/no-restricted-matchers'?: Linter.RuleEntry<PlaywrightNoRestrictedMatchers>
  /**
   * Disallows the usage of specific roles in getByRole()
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-restricted-roles.md
   */
  'playwright/no-restricted-roles'?: Linter.RuleEntry<PlaywrightNoRestrictedRoles>
  /**
   * Prevent usage of the `.skip()` skip test annotation.
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-skipped-test.md
   */
  'playwright/no-skipped-test'?: Linter.RuleEntry<PlaywrightNoSkippedTest>
  /**
   * Prevent usage of the `.slow()` slow test annotation.
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-slowed-test.md
   */
  'playwright/no-slowed-test'?: Linter.RuleEntry<PlaywrightNoSlowedTest>
  /**
   * Disallow using `expect` outside of `test` blocks
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-standalone-expect.md
   */
  'playwright/no-standalone-expect'?: Linter.RuleEntry<[]>
  /**
   * Disallow template literals in test, describe, and step titles
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-template-literal-title.md
   */
  'playwright/no-template-literal-title'?: Linter.RuleEntry<PlaywrightNoTemplateLiteralTitle>
  /**
   * Disallow explicitly returning from tests
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-test-return-statement.md
   */
  'playwright/no-test-return-statement'?: Linter.RuleEntry<[]>
  /**
   * Disallow assertions on a Locator that can never fail
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-unnecessary-assertions.md
   */
  'playwright/no-unnecessary-assertions'?: Linter.RuleEntry<[]>
  /**
   * Prevent unsafe variable references in page.evaluate() and page.addInitScript()
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-unsafe-references.md
   */
  'playwright/no-unsafe-references'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of page locators that are not used
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-unused-locators.md
   */
  'playwright/no-unused-locators'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary awaits for Playwright methods
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-useless-await.md
   */
  'playwright/no-useless-await'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of 'not' matchers when a more specific matcher exists
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-useless-not.md
   */
  'playwright/no-useless-not'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of page.waitForNavigation()
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-wait-for-navigation.md
   */
  'playwright/no-wait-for-navigation'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of page.waitForSelector()
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-wait-for-selector.md
   */
  'playwright/no-wait-for-selector'?: Linter.RuleEntry<[]>
  /**
   * Prevent usage of page.waitForTimeout()
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/no-wait-for-timeout.md
   */
  'playwright/no-wait-for-timeout'?: Linter.RuleEntry<[]>
  /**
   * Suggest using the built-in comparison matchers
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-comparison-matcher.md
   */
  'playwright/prefer-comparison-matcher'?: Linter.RuleEntry<[]>
  /**
   * Prefer having the last statement in a test be an assertion
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-ending-with-an-expect.md
   */
  'playwright/prefer-ending-with-an-expect'?: Linter.RuleEntry<PlaywrightPreferEndingWithAnExpect>
  /**
   * Suggest using the built-in equality matchers
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-equality-matcher.md
   */
  'playwright/prefer-equality-matcher'?: Linter.RuleEntry<[]>
  /**
   * Prefer having hooks in a consistent order
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-hooks-in-order.md
   */
  'playwright/prefer-hooks-in-order'?: Linter.RuleEntry<[]>
  /**
   * Suggest having hooks before any test cases
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-hooks-on-top.md
   */
  'playwright/prefer-hooks-on-top'?: Linter.RuleEntry<[]>
  /**
   * Suggest locators over page methods
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-locator.md
   */
  'playwright/prefer-locator'?: Linter.RuleEntry<[]>
  /**
   * Enforce lowercase test names
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-lowercase-title.md
   */
  'playwright/prefer-lowercase-title'?: Linter.RuleEntry<PlaywrightPreferLowercaseTitle>
  /**
   * Prefer native locator functions
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-native-locators.md
   */
  'playwright/prefer-native-locators'?: Linter.RuleEntry<PlaywrightPreferNativeLocators>
  /**
   * Suggest using `toStrictEqual()`
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-strict-equal.md
   */
  'playwright/prefer-strict-equal'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toBe()` for primitive literals
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-to-be.md
   */
  'playwright/prefer-to-be'?: Linter.RuleEntry<[]>
  /**
   * Suggest using toContain()
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-to-contain.md
   */
  'playwright/prefer-to-contain'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toHaveCount()`
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-to-have-count.md
   */
  'playwright/prefer-to-have-count'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toHaveLength()`
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-to-have-length.md
   */
  'playwright/prefer-to-have-length'?: Linter.RuleEntry<[]>
  /**
   * Prefer web first assertions
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/prefer-web-first-assertions.md
   */
  'playwright/prefer-web-first-assertions'?: Linter.RuleEntry<[]>
  /**
   * Require a reason for `.skip()` and `.fixme()` annotations
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/require-annotation-reason.md
   */
  'playwright/require-annotation-reason'?: Linter.RuleEntry<PlaywrightRequireAnnotationReason>
  /**
   * Require setup and teardown code to be within a hook
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/require-hook.md
   */
  'playwright/require-hook'?: Linter.RuleEntry<PlaywrightRequireHook>
  /**
   * Require all assertions to use `expect.soft`
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/require-soft-assertions.md
   */
  'playwright/require-soft-assertions'?: Linter.RuleEntry<[]>
  /**
   * Require test blocks to have tags
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/require-tags.md
   */
  'playwright/require-tags'?: Linter.RuleEntry<[]>
  /**
   * Require a timeout option for `toPass()`
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/require-to-pass-timeout.md
   */
  'playwright/require-to-pass-timeout'?: Linter.RuleEntry<[]>
  /**
   * Require a message for `toThrow()`
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/require-to-throw-message.md
   */
  'playwright/require-to-throw-message'?: Linter.RuleEntry<[]>
  /**
   * Require test cases and hooks to be inside a `test.describe` block
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/require-top-level-describe.md
   */
  'playwright/require-top-level-describe'?: Linter.RuleEntry<PlaywrightRequireTopLevelDescribe>
  /**
   * Enforce valid `describe()` callback
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/valid-describe-callback.md
   */
  'playwright/valid-describe-callback'?: Linter.RuleEntry<[]>
  /**
   * Enforce valid `expect()` usage
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/valid-expect.md
   */
  'playwright/valid-expect'?: Linter.RuleEntry<PlaywrightValidExpect>
  /**
   * Require promises that have expectations in their chain to be valid
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/valid-expect-in-promise.md
   */
  'playwright/valid-expect-in-promise'?: Linter.RuleEntry<[]>
  /**
   * Enforce valid tag format in Playwright test blocks and titles
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/valid-test-tags.md
   */
  'playwright/valid-test-tags'?: Linter.RuleEntry<PlaywrightValidTestTags>
  /**
   * Enforce valid titles
   * @see https://github.com/mskelton/eslint-plugin-playwright/tree/main/docs/rules/valid-title.md
   */
  'playwright/valid-title'?: Linter.RuleEntry<PlaywrightValidTitle>
  /**
   * Require using arrow functions for callbacks
   * @see https://eslint.org/docs/latest/rules/prefer-arrow-callback
   */
  'prefer-arrow-callback'?: Linter.RuleEntry<PreferArrowCallback>
  /**
   * Require `const` declarations for variables that are never reassigned after declared
   * @see https://eslint.org/docs/latest/rules/prefer-const
   */
  'prefer-const'?: Linter.RuleEntry<PreferConst>
  /**
   * Require destructuring from arrays and/or objects
   * @see https://eslint.org/docs/latest/rules/prefer-destructuring
   */
  'prefer-destructuring'?: Linter.RuleEntry<PreferDestructuring>
  /**
   * Disallow the use of `Math.pow` in favor of the `**` operator
   * @see https://eslint.org/docs/latest/rules/prefer-exponentiation-operator
   */
  'prefer-exponentiation-operator'?: Linter.RuleEntry<[]>
  /**
   * Enforce using named capture group in regular expression
   * @see https://eslint.org/docs/latest/rules/prefer-named-capture-group
   */
  'prefer-named-capture-group'?: Linter.RuleEntry<[]>
  /**
   * Disallow `parseInt()` and `Number.parseInt()` in favor of binary, octal, and hexadecimal literals
   * @see https://eslint.org/docs/latest/rules/prefer-numeric-literals
   */
  'prefer-numeric-literals'?: Linter.RuleEntry<[]>
  /**
   * Disallow use of `Object.prototype.hasOwnProperty.call()` and prefer use of `Object.hasOwn()`
   * @see https://eslint.org/docs/latest/rules/prefer-object-has-own
   */
  'prefer-object-has-own'?: Linter.RuleEntry<[]>
  /**
   * Disallow using `Object.assign` with an object literal as the first argument and prefer the use of object spread instead
   * @see https://eslint.org/docs/latest/rules/prefer-object-spread
   */
  'prefer-object-spread'?: Linter.RuleEntry<[]>
  /**
   * Require using Error objects as Promise rejection reasons
   * @see https://eslint.org/docs/latest/rules/prefer-promise-reject-errors
   */
  'prefer-promise-reject-errors'?: Linter.RuleEntry<PreferPromiseRejectErrors>
  /**
   * Require `Reflect` methods where applicable
   * @see https://eslint.org/docs/latest/rules/prefer-reflect
   * @deprecated
   */
  'prefer-reflect'?: Linter.RuleEntry<PreferReflect>
  /**
   * Disallow use of the `RegExp` constructor in favor of regular expression literals
   * @see https://eslint.org/docs/latest/rules/prefer-regex-literals
   */
  'prefer-regex-literals'?: Linter.RuleEntry<PreferRegexLiterals>
  /**
   * Require rest parameters instead of `arguments`
   * @see https://eslint.org/docs/latest/rules/prefer-rest-params
   */
  'prefer-rest-params'?: Linter.RuleEntry<[]>
  /**
   * Require spread operators instead of `.apply()`
   * @see https://eslint.org/docs/latest/rules/prefer-spread
   */
  'prefer-spread'?: Linter.RuleEntry<[]>
  /**
   * Require template literals instead of string concatenation
   * @see https://eslint.org/docs/latest/rules/prefer-template
   */
  'prefer-template'?: Linter.RuleEntry<[]>
  /**
   * Disallow losing originally caught error when re-throwing custom errors
   * @see https://eslint.org/docs/latest/rules/preserve-caught-error
   */
  'preserve-caught-error'?: Linter.RuleEntry<PreserveCaughtError>
  /**
   * Require quotes around object literal property names
   * @see https://eslint.org/docs/latest/rules/quote-props
   * @deprecated
   */
  'quote-props'?: Linter.RuleEntry<QuoteProps>
  /**
   * Enforce the consistent use of either backticks, double, or single quotes
   * @see https://eslint.org/docs/latest/rules/quotes
   * @deprecated
   */
  'quotes'?: Linter.RuleEntry<Quotes>
  /**
   * Enforce the use of the radix argument when using `parseInt()`
   * @see https://eslint.org/docs/latest/rules/radix
   */
  'radix'?: Linter.RuleEntry<Radix>
  /**
   * Validates against calling capitalized functions/methods instead of using JSX
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/capitalized-calls
   */
  'react-hooks/capitalized-calls'?: Linter.RuleEntry<ReactHooksCapitalizedCalls>
  /**
   * Deprecated: this rule has been removed in 7.1.0.
   * @deprecated
   */
  'react-hooks/component-hook-factories'?: Linter.RuleEntry<[]>
  /**
   * Validates the compiler configuration options
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/config
   */
  'react-hooks/config'?: Linter.RuleEntry<ReactHooksConfig>
  /**
   * Validates usage of error boundaries instead of try/catch for errors in child components
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/error-boundaries
   */
  'react-hooks/error-boundaries'?: Linter.RuleEntry<ReactHooksErrorBoundaries>
  /**
   * verifies the list of dependencies for Hooks like useEffect and similar
   * @see https://github.com/facebook/react/issues/14920
   */
  'react-hooks/exhaustive-deps'?: Linter.RuleEntry<ReactHooksExhaustiveDeps>
  /**
   * Validates that effect dependencies are exhaustive and without extraneous values
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-effect-dependencies
   */
  'react-hooks/exhaustive-effect-dependencies'?: Linter.RuleEntry<ReactHooksExhaustiveEffectDependencies>
  /**
   * Validates usage of fbt
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/fbt
   */
  'react-hooks/fbt'?: Linter.RuleEntry<ReactHooksFbt>
  /**
   * Validates configuration of [gating mode](https://react.dev/reference/react-compiler/gating)
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/gating
   */
  'react-hooks/gating'?: Linter.RuleEntry<ReactHooksGating>
  /**
   * Validates against assignment/mutation of globals during render, part of ensuring that [side effects must render outside of render](https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/globals
   */
  'react-hooks/globals'?: Linter.RuleEntry<ReactHooksGlobals>
  /**
   * Validates the rules of hooks
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/hooks
   */
  'react-hooks/hooks'?: Linter.RuleEntry<ReactHooksHooks>
  /**
   * Validates against mutating props, state, and other values that [are immutable](https://react.dev/reference/rules/components-and-hooks-must-be-pure#props-and-state-are-immutable)
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability
   */
  'react-hooks/immutability'?: Linter.RuleEntry<ReactHooksImmutability>
  /**
   * Validates against usage of libraries which are incompatible with memoization (manual or automatic)
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library
   */
  'react-hooks/incompatible-library'?: Linter.RuleEntry<ReactHooksIncompatibleLibrary>
  /**
   * Internal invariants
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/invariant
   */
  'react-hooks/invariant'?: Linter.RuleEntry<ReactHooksInvariant>
  /**
   * Validates that useMemo() and useCallback() specify comprehensive dependencies without extraneous values. See [`useMemo()` docs](https://react.dev/reference/react/useMemo) for more information.
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/memo-dependencies
   */
  'react-hooks/memo-dependencies'?: Linter.RuleEntry<ReactHooksMemoDependencies>
  /**
   * Validates that effect dependencies are memoized
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/memoized-effect-dependencies
   */
  'react-hooks/memoized-effect-dependencies'?: Linter.RuleEntry<ReactHooksMemoizedEffectDependencies>
  /**
   * Validates against deriving values from state in an effect
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/no-deriving-state-in-effects
   */
  'react-hooks/no-deriving-state-in-effects'?: Linter.RuleEntry<ReactHooksNoDerivingStateInEffects>
  /**
   * Validates that existing manual memoized is preserved by the compiler. React Compiler will only compile components and hooks if its inference [matches or exceeds the existing manual memoization](https://react.dev/learn/react-compiler/introduction#what-should-i-do-about-usememo-usecallback-and-reactmemo)
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization
   */
  'react-hooks/preserve-manual-memoization'?: Linter.RuleEntry<ReactHooksPreserveManualMemoization>
  /**
   * Validates that [components/hooks are pure](https://react.dev/reference/rules/components-and-hooks-must-be-pure) by checking that they do not call known-impure functions
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/purity
   */
  'react-hooks/purity'?: Linter.RuleEntry<ReactHooksPurity>
  /**
   * Validates correct usage of refs, not reading/writing during render. See the "pitfalls" section in [`useRef()` usage](https://react.dev/reference/react/useRef#usage)
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/refs
   */
  'react-hooks/refs'?: Linter.RuleEntry<ReactHooksRefs>
  /**
   * Validates against suppression of other rules
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/rule-suppression
   */
  'react-hooks/rule-suppression'?: Linter.RuleEntry<ReactHooksRuleSuppression>
  /**
   * enforces the Rules of Hooks
   * @see https://react.dev/reference/rules/rules-of-hooks
   */
  'react-hooks/rules-of-hooks'?: Linter.RuleEntry<ReactHooksRulesOfHooks>
  /**
   * Validates against calling setState synchronously in an effect. This can indicate non-local derived data, a derived event pattern, or improper external data synchronization.
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect
   */
  'react-hooks/set-state-in-effect'?: Linter.RuleEntry<ReactHooksSetStateInEffect>
  /**
   * Validates against setting state during render, which can trigger additional renders and potential infinite render loops
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-render
   */
  'react-hooks/set-state-in-render'?: Linter.RuleEntry<ReactHooksSetStateInRender>
  /**
   * Validates that components are static, not recreated every render. Components that are recreated dynamically can reset state and trigger excessive re-rendering
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components
   */
  'react-hooks/static-components'?: Linter.RuleEntry<ReactHooksStaticComponents>
  /**
   * Validates against invalid syntax
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/syntax
   */
  'react-hooks/syntax'?: Linter.RuleEntry<ReactHooksSyntax>
  /**
   * Unimplemented features
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/todo
   */
  'react-hooks/todo'?: Linter.RuleEntry<ReactHooksTodo>
  /**
   * Validates against syntax that we do not plan to support in React Compiler
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/unsupported-syntax
   */
  'react-hooks/unsupported-syntax'?: Linter.RuleEntry<ReactHooksUnsupportedSyntax>
  /**
   * Validates usage of the useMemo() hook against common mistakes. See [`useMemo()` docs](https://react.dev/reference/react/useMemo) for more information.
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/use-memo
   */
  'react-hooks/use-memo'?: Linter.RuleEntry<ReactHooksUseMemo>
  /**
   * Validates that useMemos always return a value and that the result of the useMemo is used by the component/hook. See [`useMemo()` docs](https://react.dev/reference/react/useMemo) for more information.
   * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/void-use-memo
   */
  'react-hooks/void-use-memo'?: Linter.RuleEntry<ReactHooksVoidUseMemo>
  /**
   * Disallow assignments that can lead to race conditions due to usage of `await` or `yield`
   * @see https://eslint.org/docs/latest/rules/require-atomic-updates
   */
  'require-atomic-updates'?: Linter.RuleEntry<RequireAtomicUpdates>
  /**
   * Disallow async functions which have no `await` expression
   * @see https://eslint.org/docs/latest/rules/require-await
   */
  'require-await'?: Linter.RuleEntry<[]>
  /**
   * Enforce the use of `u` or `v` flag on regular expressions
   * @see https://eslint.org/docs/latest/rules/require-unicode-regexp
   */
  'require-unicode-regexp'?: Linter.RuleEntry<RequireUnicodeRegexp>
  /**
   * Require generator functions to contain `yield`
   * @see https://eslint.org/docs/latest/rules/require-yield
   */
  'require-yield'?: Linter.RuleEntry<[]>
  /**
   * Enforce spacing between rest and spread operators and their expressions
   * @see https://eslint.org/docs/latest/rules/rest-spread-spacing
   * @deprecated
   */
  'rest-spread-spacing'?: Linter.RuleEntry<RestSpreadSpacing>
  /**
   * Require or disallow semicolons instead of ASI
   * @see https://eslint.org/docs/latest/rules/semi
   * @deprecated
   */
  'semi'?: Linter.RuleEntry<Semi>
  /**
   * Enforce consistent spacing before and after semicolons
   * @see https://eslint.org/docs/latest/rules/semi-spacing
   * @deprecated
   */
  'semi-spacing'?: Linter.RuleEntry<SemiSpacing>
  /**
   * Enforce location of semicolons
   * @see https://eslint.org/docs/latest/rules/semi-style
   * @deprecated
   */
  'semi-style'?: Linter.RuleEntry<SemiStyle>
  /**
   * Automatically sort exports.
   * @see https://github.com/lydell/eslint-plugin-simple-import-sort#sort-order
   */
  'simple-import-sort/exports'?: Linter.RuleEntry<[]>
  /**
   * Automatically sort imports.
   * @see https://github.com/lydell/eslint-plugin-simple-import-sort#sort-order
   */
  'simple-import-sort/imports'?: Linter.RuleEntry<SimpleImportSortImports>
  /**
   * Disallow early returns in components. Solid components only run once, and so conditionals should be inside JSX.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/components-return-once.md
   */
  'solid/components-return-once'?: Linter.RuleEntry<[]>
  /**
   * Enforce naming DOM element event handlers consistently and prevent Solid's analysis from misunderstanding whether a prop should be an event handler.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/event-handlers.md
   */
  'solid/event-handlers'?: Linter.RuleEntry<SolidEventHandlers>
  /**
   * Enforce consistent imports from "solid-js", "solid-js/web", and "solid-js/store".
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/imports.md
   */
  'solid/imports'?: Linter.RuleEntry<[]>
  /**
   * Disallow passing the same prop twice in JSX.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/jsx-no-duplicate-props.md
   */
  'solid/jsx-no-duplicate-props'?: Linter.RuleEntry<SolidJsxNoDuplicateProps>
  /**
   * Disallow javascript: URLs.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/jsx-no-script-url.md
   */
  'solid/jsx-no-script-url'?: Linter.RuleEntry<[]>
  /**
   * Disallow references to undefined variables in JSX. Handles custom directives.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/jsx-no-undef.md
   */
  'solid/jsx-no-undef'?: Linter.RuleEntry<SolidJsxNoUndef>
  /**
   * Prevent variables used in JSX from being marked as unused.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/jsx-uses-vars.md
   */
  'solid/jsx-uses-vars'?: Linter.RuleEntry<[]>
  /**
   * Disallow passing uncalled signal accessors or other functions as value-typed DOM element attributes.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-accessor-as-prop.md
   */
  'solid/no-accessor-as-prop'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of type-unsafe event handlers.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-array-handlers.md
   */
  'solid/no-array-handlers'?: Linter.RuleEntry<[]>
  /**
   * Disallow boolean values on enumerated attributes like draggable and tristate aria-*, which take string tokens — a boolean false removes the attribute instead of writing "false".
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-boolean-enumerated-attribute.md
   */
  'solid/no-boolean-enumerated-attribute'?: Linter.RuleEntry<[]>
  /**
   * Disallow browser-only globals inside server functions, which run exclusively on the server.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-browser-globals-in-server-function.md
   */
  'solid/no-browser-globals-in-server-function'?: Linter.RuleEntry<[]>
  /**
   * Disallow destructuring props. In Solid, props must be used with property accesses (`props.foo`) to preserve reactivity. This rule only tracks destructuring in the parameter list.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-destructure.md
   */
  'solid/no-destructure'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of the innerHTML attribute, which can often lead to security vulnerabilities.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-innerhtml.md
   */
  'solid/no-innerhtml'?: Linter.RuleEntry<SolidNoInnerhtml>
  /**
   * Disallow server functions from capturing variables in enclosing non-module scopes, mirroring the compiler's build-time validation.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-invalid-server-capture.md
   */
  'solid/no-invalid-server-capture'?: Linter.RuleEntry<[]>
  /**
   * Disallow reactive primitives at module scope, where state is shared across SSR requests.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-module-scope-reactive-primitive.md
   */
  'solid/no-module-scope-reactive-primitive'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of APIs that use ES6 Proxies, only to target environments that don't support them.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-proxy-apis.md
   */
  'solid/no-proxy-apis'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of dependency arrays in `createEffect` and `createMemo`.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-react-deps.md
   */
  'solid/no-react-deps'?: Linter.RuleEntry<[]>
  /**
   * Disallow usage of React-specific `className`/`htmlFor` props, which were deprecated in v1.4.0.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-react-specific-props.md
   */
  'solid/no-react-specific-props'?: Linter.RuleEntry<[]>
  /**
   * Disallow restating a prop or option value that is already the default.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-restated-default-options.md
   */
  'solid/no-restated-default-options'?: Linter.RuleEntry<[]>
  /**
   * Require the two-argument `createEffect(compute, effect)` form used by Solid 2.0.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-single-arg-create-effect.md
   */
  'solid/no-single-arg-create-effect'?: Linter.RuleEntry<[]>
  /**
   * Disallow mutating a store's read proxy; store state changes only through the setter's mutable draft.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-store-mutation-outside-setter.md
   */
  'solid/no-store-mutation-outside-setter'?: Linter.RuleEntry<[]>
  /**
   * Enforce using only Solid-specific namespaced attribute names (i.e. `'on:'` in `<div on:click={...} />`).
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-unknown-namespaces.md
   */
  'solid/no-unknown-namespaces'?: Linter.RuleEntry<SolidNoUnknownNamespaces>
  /**
   * Disallow signals that are never written (use a plain value) or never read (dead state).
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-unused-signal.md
   */
  'solid/no-unused-signal'?: Linter.RuleEntry<[]>
  /**
   * Disallow writing signals or stores inside `createMemo`, the compute half of `createEffect`, or a component body, which are pure owned scopes.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-write-in-pure-computation.md
   */
  'solid/no-write-in-pure-computation'?: Linter.RuleEntry<[]>
  /**
   * Enforce using the classlist prop over importing a classnames helper. The classlist prop accepts an object `{ [class: string]: boolean }` just like classnames.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/prefer-classlist.md
   * @deprecated
   */
  'solid/prefer-classlist'?: Linter.RuleEntry<SolidPreferClasslist>
  /**
   * Enforce using Solid's `<For />` component for mapping an array to JSX elements.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/prefer-for.md
   */
  'solid/prefer-for'?: Linter.RuleEntry<[]>
  /**
   * Enforce running side-effectful setup (timers, global listeners, observers) inside `onSettled` instead of the component body.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/prefer-onSettled-for-side-effects.md
   */
  'solid/prefer-onSettled-for-side-effects'?: Linter.RuleEntry<[]>
  /**
   * Enforce using Solid's `<Show />` component for conditionally showing content. Solid's compiler covers this case, so it's a stylistic rule only.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/prefer-show.md
   */
  'solid/prefer-show'?: Linter.RuleEntry<[]>
  /**
   * Enforce using the structured array/object forms of the `class` prop over manually-built class strings.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/prefer-structured-class.md
   */
  'solid/prefer-structured-class'?: Linter.RuleEntry<[]>
  /**
   * Enforce that reactivity (props, signals, memos, etc.) is properly used, so changes in those values will be tracked and update the view as expected.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/reactivity.md
   */
  'solid/reactivity'?: Linter.RuleEntry<SolidReactivity>
  /**
   * Disallow Solid 1.x APIs that were removed or renamed in Solid 2.0, with migration guidance.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/removed-api.md
   */
  'solid/removed-api'?: Linter.RuleEntry<[]>
  /**
   * Require server functions to be async, matching their client-side contract.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/require-async-server-function.md
   */
  'solid/require-async-server-function'?: Linter.RuleEntry<[]>
  /**
   * Disallow extra closing tags for components without children.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/self-closing-comp.md
   */
  'solid/self-closing-comp'?: Linter.RuleEntry<SolidSelfClosingComp>
  /**
   * Require CSS properties in the `style` prop to be valid and kebab-cased (ex. 'font-size'), not camel-cased (ex. 'fontSize') like in React, and that property values with dimensions are strings, not numbers with implicit 'px' units.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/style-prop.md
   */
  'solid/style-prop'?: Linter.RuleEntry<SolidStyleProp>
  /**
   * Enforce that "use server" directives are placed where the compiler honors them, and that module-level directive files export working server functions.
   * @see https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/valid-use-server.md
   */
  'solid/valid-use-server'?: Linter.RuleEntry<SolidValidUseServer>
  /**
   * Alternatives in regular expressions should be grouped when used with anchors
   * @see https://sonarsource.github.io/rspec/#/rspec/S5850/javascript
   */
  'sonarjs/anchor-precedence'?: Linter.RuleEntry<[]>
  /**
   * Arguments to built-in functions should match documented types
   * @see https://sonarsource.github.io/rspec/#/rspec/S3782/javascript
   */
  'sonarjs/argument-type'?: Linter.RuleEntry<[]>
  /**
   * Parameters should be passed in the correct order
   * @see https://sonarsource.github.io/rspec/#/rspec/S2234/javascript
   */
  'sonarjs/arguments-order'?: Linter.RuleEntry<[]>
  /**
   * "arguments" should not be accessed directly
   * @see https://sonarsource.github.io/rspec/#/rspec/S3513/javascript
   */
  'sonarjs/arguments-usage'?: Linter.RuleEntry<[]>
  /**
   * Callbacks of array methods should have return statements
   * @see https://sonarsource.github.io/rspec/#/rspec/S3796/javascript
   */
  'sonarjs/array-callback-without-return'?: Linter.RuleEntry<[]>
  /**
   * Array constructors should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1528/javascript
   */
  'sonarjs/array-constructor'?: Linter.RuleEntry<[]>
  /**
   * Braces and parentheses should be used consistently with arrow functions
   * @see https://sonarsource.github.io/rspec/#/rspec/S3524/javascript
   */
  'sonarjs/arrow-function-convention'?: Linter.RuleEntry<SonarjsArrowFunctionConvention>
  /**
   * Assertions should be placed inside test cases or hooks
   * @see https://sonarsource.github.io/rspec/#/rspec/S8784/javascript
   */
  'sonarjs/assertions-in-test-cases'?: Linter.RuleEntry<[]>
  /**
   * Tests should include assertions
   * @see https://sonarsource.github.io/rspec/#/rspec/S2699/javascript
   */
  'sonarjs/assertions-in-tests'?: Linter.RuleEntry<[]>
  /**
   * Async test assertions should be awaited or returned
   * @see https://sonarsource.github.io/rspec/#/rspec/S8780/javascript
   */
  'sonarjs/async-test-assertions'?: Linter.RuleEntry<[]>
  /**
   * Nested properties of Lodash and Underscore.js clone results should not be mutated
   * @see https://sonarsource.github.io/rspec/#/rspec/S9135/javascript
   */
  'sonarjs/avoid-mutating-nested-properties-of-shallow-clones'?: Linter.RuleEntry<[]>
  /**
   * AWS API Gateway should require authentication
   * @see https://sonarsource.github.io/rspec/#/rspec/S6333/javascript
   */
  'sonarjs/aws-apigateway-public-api'?: Linter.RuleEntry<[]>
  /**
   * Public network access to cloud resources should be disabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S6329/javascript
   */
  'sonarjs/aws-ec2-rds-dms-public'?: Linter.RuleEntry<[]>
  /**
   * EBS volumes should be encrypted
   * @see https://sonarsource.github.io/rspec/#/rspec/S6275/javascript
   */
  'sonarjs/aws-ec2-unencrypted-ebs-volume'?: Linter.RuleEntry<[]>
  /**
   * Amazon EFS file systems should be encrypted
   * @see https://sonarsource.github.io/rspec/#/rspec/S6332/javascript
   */
  'sonarjs/aws-efs-unencrypted'?: Linter.RuleEntry<[]>
  /**
   * Policies should not grant all privileges
   * @see https://sonarsource.github.io/rspec/#/rspec/S6302/javascript
   */
  'sonarjs/aws-iam-all-privileges'?: Linter.RuleEntry<[]>
  /**
   * IAM policies should not grant access to all account resources
   * @see https://sonarsource.github.io/rspec/#/rspec/S6304/javascript
   */
  'sonarjs/aws-iam-all-resources-accessible'?: Linter.RuleEntry<[]>
  /**
   * AWS IAM policies should limit the scope of permissions given
   * @see https://sonarsource.github.io/rspec/#/rspec/S6317/javascript
   */
  'sonarjs/aws-iam-privilege-escalation'?: Linter.RuleEntry<[]>
  /**
   * AWS resource-based policies should not grant public access
   * @see https://sonarsource.github.io/rspec/#/rspec/S6270/javascript
   */
  'sonarjs/aws-iam-public-access'?: Linter.RuleEntry<[]>
  /**
   * OpenSearch domains should have encryption at rest enabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S6308/javascript
   */
  'sonarjs/aws-opensearchservice-domain'?: Linter.RuleEntry<[]>
  /**
   * Amazon RDS resources should be encrypted at rest
   * @see https://sonarsource.github.io/rspec/#/rspec/S6303/javascript
   */
  'sonarjs/aws-rds-unencrypted-databases'?: Linter.RuleEntry<[]>
  /**
   * Administration services access should be restricted to specific IP addresses
   * @see https://sonarsource.github.io/rspec/#/rspec/S6321/javascript
   */
  'sonarjs/aws-restricted-ip-admin-access'?: Linter.RuleEntry<[]>
  /**
   * S3 buckets should not grant access to all users or authenticated users
   * @see https://sonarsource.github.io/rspec/#/rspec/S6265/javascript
   */
  'sonarjs/aws-s3-bucket-granted-access'?: Linter.RuleEntry<[]>
  /**
   * S3 buckets should enforce HTTPS-only access
   * @see https://sonarsource.github.io/rspec/#/rspec/S6249/javascript
   */
  'sonarjs/aws-s3-bucket-insecure-http'?: Linter.RuleEntry<[]>
  /**
   * Amazon S3 bucket public access should be fully blocked
   * @see https://sonarsource.github.io/rspec/#/rspec/S6281/javascript
   */
  'sonarjs/aws-s3-bucket-public-access'?: Linter.RuleEntry<[]>
  /**
   * Amazon S3 buckets should have versioning enabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S6252/javascript
   */
  'sonarjs/aws-s3-bucket-versioning'?: Linter.RuleEntry<[]>
  /**
   * SageMaker notebook instances should be encrypted at rest
   * @see https://sonarsource.github.io/rspec/#/rspec/S6319/javascript
   */
  'sonarjs/aws-sagemaker-unencrypted-notebook'?: Linter.RuleEntry<[]>
  /**
   * Amazon SNS topics should be encrypted at rest
   * @see https://sonarsource.github.io/rspec/#/rspec/S6327/javascript
   */
  'sonarjs/aws-sns-unencrypted-topics'?: Linter.RuleEntry<[]>
  /**
   * SQS queues should be encrypted
   * @see https://sonarsource.github.io/rspec/#/rspec/S6330/javascript
   */
  'sonarjs/aws-sqs-unencrypted-queue'?: Linter.RuleEntry<[]>
  /**
   * Bitwise operators should not be used in boolean contexts
   * @see https://sonarsource.github.io/rspec/#/rspec/S1529/javascript
   */
  'sonarjs/bitwise-operators'?: Linter.RuleEntry<[]>
  /**
   * Variables should be used in the blocks where they are declared
   * @see https://sonarsource.github.io/rspec/#/rspec/S2392/javascript
   */
  'sonarjs/block-scoped-var'?: Linter.RuleEntry<[]>
  /**
   * Optional boolean parameters should have default value
   * @see https://sonarsource.github.io/rspec/#/rspec/S4798/javascript
   */
  'sonarjs/bool-param-default'?: Linter.RuleEntry<[]>
  /**
   * Function call arguments should not start on new lines
   * @see https://sonarsource.github.io/rspec/#/rspec/S1472/javascript
   */
  'sonarjs/call-argument-line'?: Linter.RuleEntry<[]>
  /**
   * Chai assertions should have only one reason to succeed
   * @see https://sonarsource.github.io/rspec/#/rspec/S6092/javascript
   */
  'sonarjs/chai-determinate-assertion'?: Linter.RuleEntry<[]>
  /**
   * Class names should comply with a naming convention
   * @see https://sonarsource.github.io/rspec/#/rspec/S101/javascript
   */
  'sonarjs/class-name'?: Linter.RuleEntry<SonarjsClassName>
  /**
   * Class methods should be used instead of "prototype" assignments
   * @see https://sonarsource.github.io/rspec/#/rspec/S3525/javascript
   */
  'sonarjs/class-prototype'?: Linter.RuleEntry<[]>
  /**
   * Dynamic code execution should not use user-controlled data
   * @see https://sonarsource.github.io/rspec/#/rspec/S1523/javascript
   */
  'sonarjs/code-eval'?: Linter.RuleEntry<[]>
  /**
   * Cognitive Complexity of functions should not be too high
   * @see https://sonarsource.github.io/rspec/#/rspec/S3776/javascript
   */
  'sonarjs/cognitive-complexity'?: Linter.RuleEntry<SonarjsCognitiveComplexity>
  /**
   * Comma and logical OR operators should not be used in switch cases
   * @see https://sonarsource.github.io/rspec/#/rspec/S3616/javascript
   */
  'sonarjs/comma-or-logical-or-case'?: Linter.RuleEntry<[]>
  /**
   * Track comments matching a regular expression
   * @see https://sonarsource.github.io/rspec/#/rspec/S124/javascript
   */
  'sonarjs/comment-regex'?: Linter.RuleEntry<SonarjsCommentRegex>
  /**
   * Composite assertions should be split
   * @see https://sonarsource.github.io/rspec/#/rspec/S9073/javascript
   */
  'sonarjs/composite-assertions'?: Linter.RuleEntry<[]>
  /**
   * Regular expression quantifiers and character classes should be used concisely
   * @see https://sonarsource.github.io/rspec/#/rspec/S6353/javascript
   */
  'sonarjs/concise-regex'?: Linter.RuleEntry<[]>
  /**
   * A conditionally executed single line should be denoted by indentation
   * @see https://sonarsource.github.io/rspec/#/rspec/S3973/javascript
   * @deprecated
   */
  'sonarjs/conditional-indentation'?: Linter.RuleEntry<[]>
  /**
   * Confidential information should not be logged
   * @see https://sonarsource.github.io/rspec/#/rspec/S5757/javascript
   * @deprecated
   */
  'sonarjs/confidential-information-logging'?: Linter.RuleEntry<[]>
  /**
   * Objects should not be created to be dropped immediately without being used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1848/javascript
   */
  'sonarjs/constructor-for-side-effects'?: Linter.RuleEntry<[]>
  /**
   * HTTP request content length should be limited
   * @see https://sonarsource.github.io/rspec/#/rspec/S5693/javascript
   */
  'sonarjs/content-length'?: Linter.RuleEntry<SonarjsContentLength>
  /**
   * Content security policy fetch directives should not be disabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S5728/javascript
   */
  'sonarjs/content-security-policy'?: Linter.RuleEntry<[]>
  /**
   * Cookies should have the "HttpOnly" flag
   * @see https://sonarsource.github.io/rspec/#/rspec/S3330/javascript
   */
  'sonarjs/cookie-no-httponly'?: Linter.RuleEntry<[]>
  /**
   * Cross-Origin Resource Sharing (CORS) policy should be restricted to trusted origins
   * @see https://sonarsource.github.io/rspec/#/rspec/S5122/javascript
   */
  'sonarjs/cors'?: Linter.RuleEntry<[]>
  /**
   * CSRF protections should not be disabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S4502/javascript
   */
  'sonarjs/csrf'?: Linter.RuleEntry<[]>
  /**
   * Cyclomatic Complexity of functions should not be too high
   * @see https://sonarsource.github.io/rspec/#/rspec/S1541/javascript
   */
  'sonarjs/cyclomatic-complexity'?: Linter.RuleEntry<SonarjsCyclomaticComplexity>
  /**
   * Variables and functions should not be declared in the global scope
   * @see https://sonarsource.github.io/rspec/#/rspec/S3798/javascript
   */
  'sonarjs/declarations-in-global-scope'?: Linter.RuleEntry<[]>
  /**
   * Deprecated APIs should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1874/javascript
   */
  'sonarjs/deprecation'?: Linter.RuleEntry<[]>
  /**
   * Destructuring syntax should be used for assignments
   * @see https://sonarsource.github.io/rspec/#/rspec/S3514/javascript
   */
  'sonarjs/destructuring-assignment-syntax'?: Linter.RuleEntry<[]>
  /**
   * Strict equality operators should not be used with dissimilar types
   * @see https://sonarsource.github.io/rspec/#/rspec/S3403/javascript
   */
  'sonarjs/different-types-comparison'?: Linter.RuleEntry<[]>
  /**
   * Auto-escaping in HTML template engines should not be disabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S5247/javascript
   */
  'sonarjs/disabled-auto-escaping'?: Linter.RuleEntry<[]>
  /**
   * Remote artifacts should not be used without integrity checks
   * @see https://sonarsource.github.io/rspec/#/rspec/S5725/javascript
   */
  'sonarjs/disabled-resource-integrity'?: Linter.RuleEntry<[]>
  /**
   * Disabling Mocha timeouts should be explicit
   * @see https://sonarsource.github.io/rspec/#/rspec/S6080/javascript
   */
  'sonarjs/disabled-timeout'?: Linter.RuleEntry<[]>
  /**
   * DOMPurify configuration should not be bypassable
   * @see https://sonarsource.github.io/rspec/#/rspec/S8479/javascript
   */
  'sonarjs/dompurify-unsafe-config'?: Linter.RuleEntry<[]>
  /**
   * Character classes in regular expressions should not contain the same character twice
   * @see https://sonarsource.github.io/rspec/#/rspec/S5869/javascript
   */
  'sonarjs/duplicates-in-character-class'?: Linter.RuleEntry<[]>
  /**
   * Templates should not be constructed dynamically
   * @see https://sonarsource.github.io/rspec/#/rspec/S7790/javascript
   */
  'sonarjs/dynamically-constructed-templates'?: Linter.RuleEntry<[]>
  /**
   * "if ... else if" constructs should end with "else" clauses
   * @see https://sonarsource.github.io/rspec/#/rspec/S126/javascript
   */
  'sonarjs/elseif-without-else'?: Linter.RuleEntry<[]>
  /**
   * Repeated patterns in regular expressions should not match the empty string
   * @see https://sonarsource.github.io/rspec/#/rspec/S5842/javascript
   */
  'sonarjs/empty-string-repetition'?: Linter.RuleEntry<[]>
  /**
   * Encryption algorithms should be used with secure mode and padding scheme
   * @see https://sonarsource.github.io/rspec/#/rspec/S5542/javascript
   */
  'sonarjs/encryption-secure-mode'?: Linter.RuleEntry<[]>
  /**
   * Replacement strings should reference existing regular expression groups
   * @see https://sonarsource.github.io/rspec/#/rspec/S6328/javascript
   */
  'sonarjs/existing-groups'?: Linter.RuleEntry<[]>
  /**
   * Tests should be skipped explicitly
   * @see https://sonarsource.github.io/rspec/#/rspec/S8968/javascript
   */
  'sonarjs/explicit-test-skip'?: Linter.RuleEntry<[]>
  /**
   * Expressions should not be too complex
   * @see https://sonarsource.github.io/rspec/#/rspec/S1067/javascript
   */
  'sonarjs/expression-complexity'?: Linter.RuleEntry<SonarjsExpressionComplexity>
  /**
   * Track lack of copyright and license headers
   * @see https://sonarsource.github.io/rspec/#/rspec/S1451/javascript
   */
  'sonarjs/file-header'?: Linter.RuleEntry<SonarjsFileHeader>
  /**
   * Default export names and file names should match
   * @see https://sonarsource.github.io/rspec/#/rspec/S3317/javascript
   */
  'sonarjs/file-name-differ-from-class'?: Linter.RuleEntry<[]>
  /**
   * File permissions should not be set to world-accessible values
   * @see https://sonarsource.github.io/rspec/#/rspec/S2612/javascript
   */
  'sonarjs/file-permissions'?: Linter.RuleEntry<[]>
  /**
   * File uploads should be restricted
   * @see https://sonarsource.github.io/rspec/#/rspec/S2598/javascript
   */
  'sonarjs/file-uploads'?: Linter.RuleEntry<[]>
  /**
   * Track uses of "FIXME" tags
   * @see https://sonarsource.github.io/rspec/#/rspec/S1134/javascript
   */
  'sonarjs/fixme-tag'?: Linter.RuleEntry<[]>
  /**
   * "for...in" loops should filter properties before acting on them
   * @see https://sonarsource.github.io/rspec/#/rspec/S1535/javascript
   */
  'sonarjs/for-in'?: Linter.RuleEntry<[]>
  /**
   * A "for" loop update clause should move the counter in the right direction
   * @see https://sonarsource.github.io/rspec/#/rspec/S2251/javascript
   */
  'sonarjs/for-loop-increment-sign'?: Linter.RuleEntry<[]>
  /**
   * Content Security Policy frame-ancestors directive should not be disabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S5732/javascript
   * @deprecated
   */
  'sonarjs/frame-ancestors'?: Linter.RuleEntry<[]>
  /**
   * Functions should not be defined inside loops
   * @see https://sonarsource.github.io/rspec/#/rspec/S1515/javascript
   */
  'sonarjs/function-inside-loop'?: Linter.RuleEntry<[]>
  /**
   * Function and method names should comply with a naming convention
   * @see https://sonarsource.github.io/rspec/#/rspec/S100/javascript
   */
  'sonarjs/function-name'?: Linter.RuleEntry<SonarjsFunctionName>
  /**
   * Functions should always return the same type
   * @see https://sonarsource.github.io/rspec/#/rspec/S3800/javascript
   */
  'sonarjs/function-return-type'?: Linter.RuleEntry<[]>
  /**
   * Future reserved words should not be used as identifiers
   * @see https://sonarsource.github.io/rspec/#/rspec/S1527/javascript
   */
  'sonarjs/future-reserved-words'?: Linter.RuleEntry<[]>
  /**
   * Generators should explicitly "yield" a value
   * @see https://sonarsource.github.io/rspec/#/rspec/S3531/javascript
   */
  'sonarjs/generator-without-yield'?: Linter.RuleEntry<[]>
  /**
   * Credentials should not be hard-coded
   * @see https://sonarsource.github.io/rspec/#/rspec/S6437/javascript
   */
  'sonarjs/hardcoded-secret-signatures'?: Linter.RuleEntry<[]>
  /**
   * Weak hashing algorithms should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4790/javascript
   */
  'sonarjs/hashing'?: Linter.RuleEntry<[]>
  /**
   * Hidden files should not be served statically
   * @see https://sonarsource.github.io/rspec/#/rspec/S5691/javascript
   * @deprecated
   */
  'sonarjs/hidden-files'?: Linter.RuleEntry<[]>
  /**
   * Lifecycle hooks should not be interleaved with test cases or nested suites
   * @see https://sonarsource.github.io/rspec/#/rspec/S8782/javascript
   */
  'sonarjs/hooks-before-test-cases'?: Linter.RuleEntry<[]>
  /**
   * "in" should not be used with primitive types
   * @see https://sonarsource.github.io/rspec/#/rspec/S3785/javascript
   */
  'sonarjs/in-operator-type-error'?: Linter.RuleEntry<[]>
  /**
   * Functions should be called consistently with or without "new"
   * @see https://sonarsource.github.io/rspec/#/rspec/S3686/javascript
   */
  'sonarjs/inconsistent-function-call'?: Linter.RuleEntry<[]>
  /**
   * "indexOf" checks should not be for positive numbers
   * @see https://sonarsource.github.io/rspec/#/rspec/S2692/javascript
   */
  'sonarjs/index-of-compare-to-positive-number'?: Linter.RuleEntry<[]>
  /**
   * Cookies should have the "secure" flag
   * @see https://sonarsource.github.io/rspec/#/rspec/S2092/javascript
   */
  'sonarjs/insecure-cookie'?: Linter.RuleEntry<[]>
  /**
   * JWT should be signed and verified with strong cipher algorithms
   * @see https://sonarsource.github.io/rspec/#/rspec/S5659/javascript
   */
  'sonarjs/insecure-jwt-token'?: Linter.RuleEntry<[]>
  /**
   * Assertion arguments should be passed in the correct order
   * @see https://sonarsource.github.io/rspec/#/rspec/S3415/javascript
   */
  'sonarjs/inverted-assertion-arguments'?: Linter.RuleEntry<[]>
  /**
   * React components should not render non-boolean condition values
   * @see https://sonarsource.github.io/rspec/#/rspec/S6439/javascript
   */
  'sonarjs/jsx-no-leaked-render'?: Linter.RuleEntry<[]>
  /**
   * Only "while", "do", "for" and "switch" statements should be labelled
   * @see https://sonarsource.github.io/rspec/#/rspec/S1439/javascript
   */
  'sonarjs/label-position'?: Linter.RuleEntry<[]>
  /**
   * Opened windows should not have access to the originating page
   * @see https://sonarsource.github.io/rspec/#/rspec/S5148/javascript
   */
  'sonarjs/link-with-target-blank'?: Linter.RuleEntry<[]>
  /**
   * Files should not have too many lines of code
   * @see https://sonarsource.github.io/rspec/#/rspec/S104/javascript
   */
  'sonarjs/max-lines'?: Linter.RuleEntry<SonarjsMaxLines>
  /**
   * Functions should not have too many lines of code
   * @see https://sonarsource.github.io/rspec/#/rspec/S138/javascript
   */
  'sonarjs/max-lines-per-function'?: Linter.RuleEntry<SonarjsMaxLinesPerFunction>
  /**
   * "switch" statements should not have too many "case" clauses
   * @see https://sonarsource.github.io/rspec/#/rspec/S1479/javascript
   */
  'sonarjs/max-switch-cases'?: Linter.RuleEntry<SonarjsMaxSwitchCases>
  /**
   * Union types should not have too many elements
   * @see https://sonarsource.github.io/rspec/#/rspec/S4622/javascript
   */
  'sonarjs/max-union-size'?: Linter.RuleEntry<SonarjsMaxUnionSize>
  /**
   * Lodash and Underscore.js `memoize` calls on functions with multiple parameters should use an explicit cache key function
   * @see https://sonarsource.github.io/rspec/#/rspec/S8932/javascript
   */
  'sonarjs/memoize-cache-key'?: Linter.RuleEntry<[]>
  /**
   * "for" loop increment clauses should modify the loops' counters
   * @see https://sonarsource.github.io/rspec/#/rspec/S1994/javascript
   */
  'sonarjs/misplaced-loop-counter'?: Linter.RuleEntry<[]>
  /**
   * Control flow statements "if", "for", "while", "switch" and "try" should not be nested too deeply
   * @see https://sonarsource.github.io/rspec/#/rspec/S134/javascript
   */
  'sonarjs/nested-control-flow'?: Linter.RuleEntry<SonarjsNestedControlFlow>
  /**
   * "new" should only be used with functions and classes
   * @see https://sonarsource.github.io/rspec/#/rspec/S2999/javascript
   */
  'sonarjs/new-operator-misuse'?: Linter.RuleEntry<SonarjsNewOperatorMisuse>
  /**
   * All branches in a conditional structure should not have exactly the same implementation
   * @see https://sonarsource.github.io/rspec/#/rspec/S3923/javascript
   */
  'sonarjs/no-all-duplicated-branches'?: Linter.RuleEntry<[]>
  /**
   * "Array.prototype.sort()" and "Array.prototype.toSorted()" should use a compare function
   * @see https://sonarsource.github.io/rspec/#/rspec/S2871/javascript
   */
  'sonarjs/no-alphabetical-sort'?: Linter.RuleEntry<[]>
  /**
   * Angular built-in sanitization should not be disabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S6268/javascript
   */
  'sonarjs/no-angular-bypass-sanitization'?: Linter.RuleEntry<[]>
  /**
   * "delete" should not be used on arrays
   * @see https://sonarsource.github.io/rspec/#/rspec/S2870/javascript
   */
  'sonarjs/no-array-delete'?: Linter.RuleEntry<[]>
  /**
   * Array indexes should be numeric
   * @see https://sonarsource.github.io/rspec/#/rspec/S3579/javascript
   */
  'sonarjs/no-associative-arrays'?: Linter.RuleEntry<[]>
  /**
   * Constructors should not contain asynchronous operations
   * @see https://sonarsource.github.io/rspec/#/rspec/S7059/javascript
   */
  'sonarjs/no-async-constructor'?: Linter.RuleEntry<[]>
  /**
   * Built-in objects should not be overridden
   * @see https://sonarsource.github.io/rspec/#/rspec/S2424/javascript
   */
  'sonarjs/no-built-in-override'?: Linter.RuleEntry<[]>
  /**
   * "switch" statements should not contain non-case labels
   * @see https://sonarsource.github.io/rspec/#/rspec/S1219/javascript
   */
  'sonarjs/no-case-label-in-switch'?: Linter.RuleEntry<[]>
  /**
   * Clear-text protocols should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S5332/javascript
   */
  'sonarjs/no-clear-text-protocols'?: Linter.RuleEntry<[]>
  /**
   * Tests should not execute any code after "done()" is called
   * @see https://sonarsource.github.io/rspec/#/rspec/S6079/javascript
   */
  'sonarjs/no-code-after-done'?: Linter.RuleEntry<[]>
  /**
   * Mergeable "if" statements should be combined
   * @see https://sonarsource.github.io/rspec/#/rspec/S1066/javascript
   */
  'sonarjs/no-collapsible-if'?: Linter.RuleEntry<[]>
  /**
   * Collection size and array length comparisons should make sense
   * @see https://sonarsource.github.io/rspec/#/rspec/S3981/javascript
   */
  'sonarjs/no-collection-size-mischeck'?: Linter.RuleEntry<[]>
  /**
   * Sections of code should not be commented out
   * @see https://sonarsource.github.io/rspec/#/rspec/S125/javascript
   */
  'sonarjs/no-commented-code'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not contain control characters
   * @see https://sonarsource.github.io/rspec/#/rspec/S6324/javascript
   */
  'sonarjs/no-control-regex'?: Linter.RuleEntry<[]>
  /**
   * Unused assignments should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1854/javascript
   */
  'sonarjs/no-dead-store'?: Linter.RuleEntry<[]>
  /**
   * Lodash and Underscore.js debounced or throttled functions should not be recreated on every React render
   * @see https://sonarsource.github.io/rspec/#/rspec/S9114/javascript
   */
  'sonarjs/no-debounce-throttle-in-render'?: Linter.RuleEntry<[]>
  /**
   * UI test debug commands should not be committed to version control
   * @see https://sonarsource.github.io/rspec/#/rspec/S8959/javascript
   */
  'sonarjs/no-debug-commands-in-ui-tests'?: Linter.RuleEntry<[]>
  /**
   * Default imports from modular utility libraries should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S8927/javascript
   */
  'sonarjs/no-default-utility-imports'?: Linter.RuleEntry<[]>
  /**
   * "delete" should be used only with object properties
   * @see https://sonarsource.github.io/rspec/#/rspec/S3001/javascript
   */
  'sonarjs/no-delete-var'?: Linter.RuleEntry<[]>
  /**
   * Union and intersection types should not include duplicated constituents
   * @see https://sonarsource.github.io/rspec/#/rspec/S4621/javascript
   */
  'sonarjs/no-duplicate-in-composite'?: Linter.RuleEntry<[]>
  /**
   * Parameterized tests should not contain duplicate test cases
   * @see https://sonarsource.github.io/rspec/#/rspec/S9078/javascript
   */
  'sonarjs/no-duplicate-parameterized-test-case'?: Linter.RuleEntry<[]>
  /**
   * String literals should not be duplicated
   * @see https://sonarsource.github.io/rspec/#/rspec/S1192/javascript
   */
  'sonarjs/no-duplicate-string'?: Linter.RuleEntry<SonarjsNoDuplicateString>
  /**
   * Test titles should be unique within the same suite
   * @see https://sonarsource.github.io/rspec/#/rspec/S8754/javascript
   */
  'sonarjs/no-duplicate-test-title'?: Linter.RuleEntry<[]>
  /**
   * Two branches in a conditional structure should not have exactly the same implementation
   * @see https://sonarsource.github.io/rspec/#/rspec/S1871/javascript
   */
  'sonarjs/no-duplicated-branches'?: Linter.RuleEntry<[]>
  /**
   * Collection elements should not be replaced unconditionally
   * @see https://sonarsource.github.io/rspec/#/rspec/S4143/javascript
   */
  'sonarjs/no-element-overwrite'?: Linter.RuleEntry<[]>
  /**
   * Reluctant quantifiers in regular expressions should be followed by an expression that can't match the empty string
   * @see https://sonarsource.github.io/rspec/#/rspec/S6019/javascript
   */
  'sonarjs/no-empty-after-reluctant'?: Linter.RuleEntry<[]>
  /**
   * Alternation in regular expressions should not contain empty alternatives
   * @see https://sonarsource.github.io/rspec/#/rspec/S6323/javascript
   */
  'sonarjs/no-empty-alternatives'?: Linter.RuleEntry<[]>
  /**
   * Empty character classes should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2639/javascript
   */
  'sonarjs/no-empty-character-class'?: Linter.RuleEntry<[]>
  /**
   * Empty collections should not be accessed or iterated
   * @see https://sonarsource.github.io/rspec/#/rspec/S4158/javascript
   */
  'sonarjs/no-empty-collection'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not contain empty groups
   * @see https://sonarsource.github.io/rspec/#/rspec/S6331/javascript
   */
  'sonarjs/no-empty-group'?: Linter.RuleEntry<[]>
  /**
   * Parameterized tests should not have empty datasets
   * @see https://sonarsource.github.io/rspec/#/rspec/S8998/javascript
   */
  'sonarjs/no-empty-parameterized-test-dataset'?: Linter.RuleEntry<[]>
  /**
   * Test files should contain at least one test case
   * @see https://sonarsource.github.io/rspec/#/rspec/S2187/javascript
   */
  'sonarjs/no-empty-test-file'?: Linter.RuleEntry<[]>
  /**
   * Test and suite titles should not be empty or whitespace-only
   * @see https://sonarsource.github.io/rspec/#/rspec/S8781/javascript
   */
  'sonarjs/no-empty-test-title'?: Linter.RuleEntry<[]>
  /**
   * Equality operators should not be used in "for" loop termination conditions
   * @see https://sonarsource.github.io/rspec/#/rspec/S888/javascript
   */
  'sonarjs/no-equals-in-for-termination'?: Linter.RuleEntry<[]>
  /**
   * Exclusive tests should not be committed to version control
   * @see https://sonarsource.github.io/rspec/#/rspec/S6426/javascript
   */
  'sonarjs/no-exclusive-tests'?: Linter.RuleEntry<[]>
  /**
   * Function calls should not pass extra arguments
   * @see https://sonarsource.github.io/rspec/#/rspec/S930/javascript
   */
  'sonarjs/no-extra-arguments'?: Linter.RuleEntry<[]>
  /**
   * Switch cases should end with an unconditional "break" statement
   * @see https://sonarsource.github.io/rspec/#/rspec/S128/javascript
   */
  'sonarjs/no-fallthrough'?: Linter.RuleEntry<[]>
  /**
   * Fixed waits should not be used in tests
   * @see https://sonarsource.github.io/rspec/#/rspec/S2925/javascript
   */
  'sonarjs/no-fixed-wait-in-tests'?: Linter.RuleEntry<[]>
  /**
   * Floating point numbers should not be tested for equality
   * @see https://sonarsource.github.io/rspec/#/rspec/S1244/javascript
   */
  'sonarjs/no-floating-point-equality'?: Linter.RuleEntry<[]>
  /**
   * "for in" should not be used with iterables
   * @see https://sonarsource.github.io/rspec/#/rspec/S4139/javascript
   */
  'sonarjs/no-for-in-iterable'?: Linter.RuleEntry<[]>
  /**
   * Forced browser interactions should not bypass actionability checks
   * @see https://sonarsource.github.io/rspec/#/rspec/S8783/javascript
   */
  'sonarjs/no-forced-browser-interaction'?: Linter.RuleEntry<[]>
  /**
   * Function declarations should not be made within blocks
   * @see https://sonarsource.github.io/rspec/#/rspec/S1530/javascript
   */
  'sonarjs/no-function-declaration-in-block'?: Linter.RuleEntry<[]>
  /**
   * The global "this" object should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2990/javascript
   */
  'sonarjs/no-global-this'?: Linter.RuleEntry<[]>
  /**
   * Special identifiers should not be bound or assigned
   * @see https://sonarsource.github.io/rspec/#/rspec/S2137/javascript
   */
  'sonarjs/no-globals-shadowing'?: Linter.RuleEntry<[]>
  /**
   * Boolean expressions should not be gratuitous
   * @see https://sonarsource.github.io/rspec/#/rspec/S2589/javascript
   */
  'sonarjs/no-gratuitous-expressions'?: Linter.RuleEntry<[]>
  /**
   * IP addresses should not be hardcoded
   * @see https://sonarsource.github.io/rspec/#/rspec/S1313/javascript
   */
  'sonarjs/no-hardcoded-ip'?: Linter.RuleEntry<[]>
  /**
   * Credentials should not be hard-coded
   * @see https://sonarsource.github.io/rspec/#/rspec/S2068/javascript
   */
  'sonarjs/no-hardcoded-passwords'?: Linter.RuleEntry<SonarjsNoHardcodedPasswords>
  /**
   * Secrets should not be hard-coded
   * @see https://sonarsource.github.io/rspec/#/rspec/S6418/javascript
   */
  'sonarjs/no-hardcoded-secrets'?: Linter.RuleEntry<SonarjsNoHardcodedSecrets>
  /**
   * React's useState hook should not be used directly in the render function or body of a component
   * @see https://sonarsource.github.io/rspec/#/rspec/S6442/javascript
   */
  'sonarjs/no-hook-setter-in-body'?: Linter.RuleEntry<[]>
  /**
   * "if/else if" chains and "switch" cases should not have the same condition
   * @see https://sonarsource.github.io/rspec/#/rspec/S1862/javascript
   */
  'sonarjs/no-identical-conditions'?: Linter.RuleEntry<[]>
  /**
   * Identical expressions should not be used on both sides of a binary operator
   * @see https://sonarsource.github.io/rspec/#/rspec/S1764/javascript
   */
  'sonarjs/no-identical-expressions'?: Linter.RuleEntry<[]>
  /**
   * Functions should not have identical implementations
   * @see https://sonarsource.github.io/rspec/#/rspec/S4144/javascript
   */
  'sonarjs/no-identical-functions'?: Linter.RuleEntry<SonarjsNoIdenticalFunctions>
  /**
   * Exceptions should not be ignored
   * @see https://sonarsource.github.io/rspec/#/rspec/S2486/javascript
   */
  'sonarjs/no-ignored-exceptions'?: Linter.RuleEntry<[]>
  /**
   * Return values from functions without side effects should not be ignored
   * @see https://sonarsource.github.io/rspec/#/rspec/S2201/javascript
   */
  'sonarjs/no-ignored-return'?: Linter.RuleEntry<[]>
  /**
   * Dependencies should be explicit
   * @see https://sonarsource.github.io/rspec/#/rspec/S4328/javascript
   */
  'sonarjs/no-implicit-dependencies'?: Linter.RuleEntry<SonarjsNoImplicitDependencies>
  /**
   * Variables should be declared explicitly
   * @see https://sonarsource.github.io/rspec/#/rspec/S2703/javascript
   */
  'sonarjs/no-implicit-global'?: Linter.RuleEntry<[]>
  /**
   * "in" should not be used on arrays
   * @see https://sonarsource.github.io/rspec/#/rspec/S4619/javascript
   */
  'sonarjs/no-in-misuse'?: Linter.RuleEntry<[]>
  /**
   * Assertions comparing incompatible types should not be made
   * @see https://sonarsource.github.io/rspec/#/rspec/S5845/javascript
   */
  'sonarjs/no-incompatible-assertion-types'?: Linter.RuleEntry<[]>
  /**
   * Assertions should be complete
   * @see https://sonarsource.github.io/rspec/#/rspec/S2970/javascript
   */
  'sonarjs/no-incomplete-assertions'?: Linter.RuleEntry<[]>
  /**
   * Functions should use "return" consistently
   * @see https://sonarsource.github.io/rspec/#/rspec/S3801/javascript
   */
  'sonarjs/no-inconsistent-returns'?: Linter.RuleEntry<[]>
  /**
   * Strings and non-strings should not be added
   * @see https://sonarsource.github.io/rspec/#/rspec/S3402/javascript
   */
  'sonarjs/no-incorrect-string-concat'?: Linter.RuleEntry<[]>
  /**
   * Users should not use internal APIs
   * @see https://sonarsource.github.io/rspec/#/rspec/S6627/javascript
   */
  'sonarjs/no-internal-api-use'?: Linter.RuleEntry<[]>
  /**
   * Inline snapshots should not contain interpolations
   * @see https://sonarsource.github.io/rspec/#/rspec/S8967/javascript
   */
  'sonarjs/no-interpolation-in-inline-snapshots'?: Linter.RuleEntry<[]>
  /**
   * Sensitive permissions should not be requested unnecessarily
   * @see https://sonarsource.github.io/rspec/#/rspec/S5604/javascript
   * @deprecated
   */
  'sonarjs/no-intrusive-permissions'?: Linter.RuleEntry<SonarjsNoIntrusivePermissions>
  /**
   * Regular expressions should be syntactically valid
   * @see https://sonarsource.github.io/rspec/#/rspec/S5856/javascript
   */
  'sonarjs/no-invalid-regexp'?: Linter.RuleEntry<[]>
  /**
   * Function returns should not be invariant
   * @see https://sonarsource.github.io/rspec/#/rspec/S3516/javascript
   */
  'sonarjs/no-invariant-returns'?: Linter.RuleEntry<[]>
  /**
   * Boolean checks should not be inverted
   * @see https://sonarsource.github.io/rspec/#/rspec/S1940/javascript
   */
  'sonarjs/no-inverted-boolean-check'?: Linter.RuleEntry<[]>
  /**
   * Client IP address should not be forwarded to proxies
   * @see https://sonarsource.github.io/rspec/#/rspec/S5759/javascript
   * @deprecated
   */
  'sonarjs/no-ip-forward'?: Linter.RuleEntry<[]>
  /**
   * Labels should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1119/javascript
   */
  'sonarjs/no-labels'?: Linter.RuleEntry<[]>
  /**
   * Literals should not be used as functions
   * @see https://sonarsource.github.io/rspec/#/rspec/S6958/javascript
   */
  'sonarjs/no-literal-call'?: Linter.RuleEntry<[]>
  /**
   * Browsers should not be allowed to perform MIME type sniffing
   * @see https://sonarsource.github.io/rspec/#/rspec/S5734/javascript
   */
  'sonarjs/no-mime-sniff'?: Linter.RuleEntry<[]>
  /**
   * Array-mutating methods should not be used misleadingly
   * @see https://sonarsource.github.io/rspec/#/rspec/S4043/javascript
   */
  'sonarjs/no-misleading-array-reverse'?: Linter.RuleEntry<[]>
  /**
   * Unicode Grapheme Clusters should be avoided inside regex character classes
   * @see https://sonarsource.github.io/rspec/#/rspec/S5868/javascript
   */
  'sonarjs/no-misleading-character-class'?: Linter.RuleEntry<[]>
  /**
   * Test and hook callbacks should use a single completion style
   * @see https://sonarsource.github.io/rspec/#/rspec/S8960/javascript
   */
  'sonarjs/no-mixed-completion-style'?: Linter.RuleEntry<[]>
  /**
   * Content Security Policy should block mixed-content
   * @see https://sonarsource.github.io/rspec/#/rspec/S5730/javascript
   * @deprecated
   */
  'sonarjs/no-mixed-content'?: Linter.RuleEntry<[]>
  /**
   * Reactive state should not be unconditionally mutated inside Vue's "updated" lifecycle hook
   * @see https://sonarsource.github.io/rspec/#/rspec/S9163/javascript
   */
  'sonarjs/no-mutate-reactive-state-in-updated-hook'?: Linter.RuleEntry<[]>
  /**
   * Assignments should not be made from within sub-expressions
   * @see https://sonarsource.github.io/rspec/#/rspec/S1121/javascript
   */
  'sonarjs/no-nested-assignment'?: Linter.RuleEntry<[]>
  /**
   * Ternary operators should not be nested
   * @see https://sonarsource.github.io/rspec/#/rspec/S3358/javascript
   */
  'sonarjs/no-nested-conditional'?: Linter.RuleEntry<[]>
  /**
   * Functions should not be nested too deeply
   * @see https://sonarsource.github.io/rspec/#/rspec/S2004/javascript
   */
  'sonarjs/no-nested-functions'?: Linter.RuleEntry<SonarjsNoNestedFunctions>
  /**
   * Increment (++) and decrement (--) operators should not be used in a method call or mixed with other operators in an expression
   * @see https://sonarsource.github.io/rspec/#/rspec/S881/javascript
   */
  'sonarjs/no-nested-incdec'?: Linter.RuleEntry<[]>
  /**
   * "switch" statements should not be nested
   * @see https://sonarsource.github.io/rspec/#/rspec/S1821/javascript
   */
  'sonarjs/no-nested-switch'?: Linter.RuleEntry<[]>
  /**
   * Template literals should not be nested
   * @see https://sonarsource.github.io/rspec/#/rspec/S4624/javascript
   */
  'sonarjs/no-nested-template-literals'?: Linter.RuleEntry<[]>
  /**
   * Playwright "networkidle" waits should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S9332/javascript
   */
  'sonarjs/no-networkidle-wait'?: Linter.RuleEntry<[]>
  /**
   * OS commands should not rely on PATH resolution
   * @see https://sonarsource.github.io/rspec/#/rspec/S4036/javascript
   */
  'sonarjs/no-os-command-from-path'?: Linter.RuleEntry<[]>
  /**
   * Initial values of parameters, caught exceptions, and loop variables should not be ignored
   * @see https://sonarsource.github.io/rspec/#/rspec/S1226/javascript
   */
  'sonarjs/no-parameter-reassignment'?: Linter.RuleEntry<[]>
  /**
   * Wrapper objects should not be used for primitive types
   * @see https://sonarsource.github.io/rspec/#/rspec/S1533/javascript
   */
  'sonarjs/no-primitive-wrappers'?: Linter.RuleEntry<[]>
  /**
   * Assignments should not be redundant
   * @see https://sonarsource.github.io/rspec/#/rspec/S4165/javascript
   */
  'sonarjs/no-redundant-assignments'?: Linter.RuleEntry<[]>
  /**
   * Boolean literals should not be used in comparisons
   * @see https://sonarsource.github.io/rspec/#/rspec/S1125/javascript
   */
  'sonarjs/no-redundant-boolean'?: Linter.RuleEntry<[]>
  /**
   * Jump statements should not be redundant
   * @see https://sonarsource.github.io/rspec/#/rspec/S3626/javascript
   */
  'sonarjs/no-redundant-jump'?: Linter.RuleEntry<[]>
  /**
   * Optional property declarations should not use both '?' and 'undefined' syntax
   * @see https://sonarsource.github.io/rspec/#/rspec/S4782/javascript
   */
  'sonarjs/no-redundant-optional'?: Linter.RuleEntry<[]>
  /**
   * Redundant pairs of parentheses should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1110/javascript
   * @deprecated
   */
  'sonarjs/no-redundant-parentheses'?: Linter.RuleEntry<[]>
  /**
   * Variables should be defined before being used
   * @see https://sonarsource.github.io/rspec/#/rspec/S3827/javascript
   */
  'sonarjs/no-reference-error'?: Linter.RuleEntry<[]>
  /**
   * HTTP Referrer-Policy should not be set to an unsafe value
   * @see https://sonarsource.github.io/rspec/#/rspec/S5736/javascript
   */
  'sonarjs/no-referrer-policy'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not contain multiple spaces
   * @see https://sonarsource.github.io/rspec/#/rspec/S6326/javascript
   */
  'sonarjs/no-regex-spaces'?: Linter.RuleEntry<[]>
  /**
   * "import" should be used to include external code
   * @see https://sonarsource.github.io/rspec/#/rspec/S3533/javascript
   */
  'sonarjs/no-require-or-define'?: Linter.RuleEntry<[]>
  /**
   * Primitive return types should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4324/javascript
   */
  'sonarjs/no-return-type-any'?: Linter.RuleEntry<[]>
  /**
   * Assertions should not be given twice the same argument
   * @see https://sonarsource.github.io/rspec/#/rspec/S5863/javascript
   */
  'sonarjs/no-same-argument-assert'?: Linter.RuleEntry<[]>
  /**
   * Conditionals should start on new lines
   * @see https://sonarsource.github.io/rspec/#/rspec/S3972/javascript
   */
  'sonarjs/no-same-line-conditional'?: Linter.RuleEntry<[]>
  /**
   * Methods should not contain selector parameters
   * @see https://sonarsource.github.io/rspec/#/rspec/S2301/javascript
   */
  'sonarjs/no-selector-parameter'?: Linter.RuleEntry<[]>
  /**
   * Static Assets should not serve session cookies
   * @see https://sonarsource.github.io/rspec/#/rspec/S8441/javascript
   */
  'sonarjs/no-session-cookies-on-static-assets'?: Linter.RuleEntry<[]>
  /**
   * Tests should not be skipped without providing a reason
   * @see https://sonarsource.github.io/rspec/#/rspec/S1607/javascript
   */
  'sonarjs/no-skipped-tests'?: Linter.RuleEntry<[]>
  /**
   * "if" statements should be preferred over "switch" when simpler
   * @see https://sonarsource.github.io/rspec/#/rspec/S1301/javascript
   */
  'sonarjs/no-small-switch'?: Linter.RuleEntry<[]>
  /**
   * Track uses of "NOSONAR" comments
   * @see https://sonarsource.github.io/rspec/#/rspec/S1291/javascript
   */
  'sonarjs/no-sonar-comments'?: Linter.RuleEntry<[]>
  /**
   * Tabulation characters should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S105/javascript
   * @deprecated
   */
  'sonarjs/no-tab'?: Linter.RuleEntry<[]>
  /**
   * HTML "<table>" should not be used for layout purposes
   * @see https://sonarsource.github.io/rspec/#/rspec/S5257/javascript
   */
  'sonarjs/no-table-as-layout'?: Linter.RuleEntry<[]>
  /**
   * Assertions should not be trivially true
   * @see https://sonarsource.github.io/rspec/#/rspec/S5914/javascript
   */
  'sonarjs/no-trivial-assertions'?: Linter.RuleEntry<[]>
  /**
   * Promise rejections should not be caught by "try" blocks
   * @see https://sonarsource.github.io/rspec/#/rspec/S4822/javascript
   */
  'sonarjs/no-try-promise'?: Linter.RuleEntry<[]>
  /**
   * "undefined" should not be passed as the value of optional parameters
   * @see https://sonarsource.github.io/rspec/#/rspec/S4623/javascript
   */
  'sonarjs/no-undefined-argument'?: Linter.RuleEntry<[]>
  /**
   * "undefined" should not be assigned
   * @see https://sonarsource.github.io/rspec/#/rspec/S2138/javascript
   */
  'sonarjs/no-undefined-assignment'?: Linter.RuleEntry<[]>
  /**
   * Multiline blocks should be enclosed in curly braces
   * @see https://sonarsource.github.io/rspec/#/rspec/S2681/javascript
   */
  'sonarjs/no-unenclosed-multiline-block'?: Linter.RuleEntry<[]>
  /**
   * JSX list components keys should match up between renders
   * @see https://sonarsource.github.io/rspec/#/rspec/S6486/javascript
   */
  'sonarjs/no-uniq-key'?: Linter.RuleEntry<[]>
  /**
   * Expanding archive files should not be done without controlling resource consumption
   * @see https://sonarsource.github.io/rspec/#/rspec/S5042/javascript
   * @deprecated
   */
  'sonarjs/no-unsafe-unzip'?: Linter.RuleEntry<[]>
  /**
   * Errors should not be created without being thrown
   * @see https://sonarsource.github.io/rspec/#/rspec/S3984/javascript
   */
  'sonarjs/no-unthrown-error'?: Linter.RuleEntry<[]>
  /**
   * Collection contents should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4030/javascript
   */
  'sonarjs/no-unused-collection'?: Linter.RuleEntry<[]>
  /**
   * Unused function parameters should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1172/javascript
   */
  'sonarjs/no-unused-function-argument'?: Linter.RuleEntry<[]>
  /**
   * Unused local variables and functions should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1481/javascript
   */
  'sonarjs/no-unused-vars'?: Linter.RuleEntry<[]>
  /**
   * The return value of void functions should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S3699/javascript
   */
  'sonarjs/no-use-of-empty-return-value'?: Linter.RuleEntry<[]>
  /**
   * "catch" clauses should do more than rethrow
   * @see https://sonarsource.github.io/rspec/#/rspec/S2737/javascript
   */
  'sonarjs/no-useless-catch'?: Linter.RuleEntry<[]>
  /**
   * Values should not be uselessly incremented
   * @see https://sonarsource.github.io/rspec/#/rspec/S2123/javascript
   */
  'sonarjs/no-useless-increment'?: Linter.RuleEntry<[]>
  /**
   * Type intersections should use meaningful types
   * @see https://sonarsource.github.io/rspec/#/rspec/S4335/javascript
   */
  'sonarjs/no-useless-intersection'?: Linter.RuleEntry<[]>
  /**
   * React state setter function should not be called with its matching state variable
   * @see https://sonarsource.github.io/rspec/#/rspec/S6443/javascript
   */
  'sonarjs/no-useless-react-setstate'?: Linter.RuleEntry<[]>
  /**
   * Variables declared with "var" should be declared before they are used
   * @see https://sonarsource.github.io/rspec/#/rspec/S1526/javascript
   */
  'sonarjs/no-variable-usage-before-declaration'?: Linter.RuleEntry<[]>
  /**
   * Vue components should not use the deprecated "vue-class-component" or "vue-property-decorator" libraries
   * @see https://sonarsource.github.io/rspec/#/rspec/S9145/javascript
   */
  'sonarjs/no-vue-class-component'?: Linter.RuleEntry<[]>
  /**
   * Vue components should not use mixins
   * @see https://sonarsource.github.io/rspec/#/rspec/S9150/javascript
   */
  'sonarjs/no-vue-mixins'?: Linter.RuleEntry<[]>
  /**
   * Cipher algorithms should be robust
   * @see https://sonarsource.github.io/rspec/#/rspec/S5547/javascript
   */
  'sonarjs/no-weak-cipher'?: Linter.RuleEntry<[]>
  /**
   * Cryptographic keys should be robust
   * @see https://sonarsource.github.io/rspec/#/rspec/S4426/javascript
   */
  'sonarjs/no-weak-keys'?: Linter.RuleEntry<[]>
  /**
   * Wildcard imports should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2208/javascript
   */
  'sonarjs/no-wildcard-import'?: Linter.RuleEntry<[]>
  /**
   * Non-existent operators '=+', '=-' and '=!' should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2757/javascript
   */
  'sonarjs/non-existent-operator'?: Linter.RuleEntry<[]>
  /**
   * Arithmetic operators should only have numbers as operands
   * @see https://sonarsource.github.io/rspec/#/rspec/S3760/javascript
   */
  'sonarjs/non-number-in-arithmetic-expression'?: Linter.RuleEntry<[]>
  /**
   * Properties of variables with "null" or "undefined" values should not be accessed
   * @see https://sonarsource.github.io/rspec/#/rspec/S2259/javascript
   */
  'sonarjs/null-dereference'?: Linter.RuleEntry<[]>
  /**
   * "<object>" tags should provide an alternative content
   * @see https://sonarsource.github.io/rspec/#/rspec/S5264/javascript
   */
  'sonarjs/object-alt-content'?: Linter.RuleEntry<[]>
  /**
   * Arithmetic operations should not result in "NaN"
   * @see https://sonarsource.github.io/rspec/#/rspec/S3757/javascript
   */
  'sonarjs/operation-returning-nan'?: Linter.RuleEntry<[]>
  /**
   * OS commands should not be executed using a shell interpreter
   * @see https://sonarsource.github.io/rspec/#/rspec/S4721/javascript
   * @deprecated
   */
  'sonarjs/os-command'?: Linter.RuleEntry<[]>
  /**
   * Similar tests should be grouped in a single Parameterized test
   * @see https://sonarsource.github.io/rspec/#/rspec/S5976/javascript
   */
  'sonarjs/parameterized-tests'?: Linter.RuleEntry<[]>
  /**
   * Origins should be verified during cross-origin communications
   * @see https://sonarsource.github.io/rspec/#/rspec/S2819/javascript
   */
  'sonarjs/post-message'?: Linter.RuleEntry<[]>
  /**
   * Cypress assertions should be retryable
   * @see https://sonarsource.github.io/rspec/#/rspec/S9162/javascript
   */
  'sonarjs/prefer-cypress-should'?: Linter.RuleEntry<[]>
  /**
   * "default" clauses should be last
   * @see https://sonarsource.github.io/rspec/#/rspec/S4524/javascript
   */
  'sonarjs/prefer-default-last'?: Linter.RuleEntry<[]>
  /**
   * Local variables should not be declared and then immediately returned or thrown
   * @see https://sonarsource.github.io/rspec/#/rspec/S1488/javascript
   */
  'sonarjs/prefer-immediate-return'?: Linter.RuleEntry<[]>
  /**
   * Native APIs should be preferred over Axios utility methods
   * @see https://sonarsource.github.io/rspec/#/rspec/S9339/javascript
   */
  'sonarjs/prefer-native-axios-alternative'?: Linter.RuleEntry<[]>
  /**
   * Native APIs should be preferred over jQuery utility methods
   * @see https://sonarsource.github.io/rspec/#/rspec/S9144/javascript
   */
  'sonarjs/prefer-native-jquery-alternative'?: Linter.RuleEntry<[]>
  /**
   * Native APIs should be preferred over Lodash and Underscore.js methods
   * @see https://sonarsource.github.io/rspec/#/rspec/S8907/javascript
   */
  'sonarjs/prefer-native-lodash-alternative'?: Linter.RuleEntry<[]>
  /**
   * Object literal syntax should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2428/javascript
   */
  'sonarjs/prefer-object-literal'?: Linter.RuleEntry<[]>
  /**
   * Shorthand promises should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4634/javascript
   */
  'sonarjs/prefer-promise-shorthand'?: Linter.RuleEntry<[]>
  /**
   * React props should be read-only
   * @see https://sonarsource.github.io/rspec/#/rspec/S6759/javascript
   */
  'sonarjs/prefer-read-only-props'?: Linter.RuleEntry<[]>
  /**
   * "RegExp.exec()" should be preferred over "String.match()"
   * @see https://sonarsource.github.io/rspec/#/rspec/S6594/javascript
   */
  'sonarjs/prefer-regexp-exec'?: Linter.RuleEntry<[]>
  /**
   * Return of boolean expressions should not be wrapped into an "if-then-else" statement
   * @see https://sonarsource.github.io/rspec/#/rspec/S1126/javascript
   */
  'sonarjs/prefer-single-boolean-return'?: Linter.RuleEntry<[]>
  /**
   * The most specific assertion should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S5906/javascript
   */
  'sonarjs/prefer-specific-assertions'?: Linter.RuleEntry<[]>
  /**
   * Type predicates should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4322/javascript
   */
  'sonarjs/prefer-type-guard'?: Linter.RuleEntry<[]>
  /**
   * A "while" loop should be used instead of a "for" loop
   * @see https://sonarsource.github.io/rspec/#/rspec/S1264/javascript
   */
  'sonarjs/prefer-while'?: Linter.RuleEntry<[]>
  /**
   * Debugging features should not be enabled in production
   * @see https://sonarsource.github.io/rspec/#/rspec/S4507/javascript
   */
  'sonarjs/production-debug'?: Linter.RuleEntry<[]>
  /**
   * Pseudorandom number generators (PRNGs) should not be used in security contexts
   * @see https://sonarsource.github.io/rspec/#/rspec/S2245/javascript
   */
  'sonarjs/pseudo-random'?: Linter.RuleEntry<[]>
  /**
   * Public "static" fields should be read-only
   * @see https://sonarsource.github.io/rspec/#/rspec/S1444/javascript
   */
  'sonarjs/public-static-readonly'?: Linter.RuleEntry<[]>
  /**
   * Temporary files should not be created in publicly writable directories
   * @see https://sonarsource.github.io/rspec/#/rspec/S5443/javascript
   */
  'sonarjs/publicly-writable-directories'?: Linter.RuleEntry<[]>
  /**
   * "Array.reduce()" calls should include an initial value
   * @see https://sonarsource.github.io/rspec/#/rspec/S6959/javascript
   */
  'sonarjs/reduce-initial-value'?: Linter.RuleEntry<[]>
  /**
   * Redundant type aliases should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S6564/javascript
   */
  'sonarjs/redundant-type-aliases'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not be too complicated
   * @see https://sonarsource.github.io/rspec/#/rspec/S5843/javascript
   */
  'sonarjs/regex-complexity'?: Linter.RuleEntry<SonarjsRegexComplexity>
  /**
   * Wallet phrases should not be hard-coded
   * @see https://sonarsource.github.io/rspec/#/rspec/S7639/javascript
   */
  'sonarjs/review-blockchain-mnemonic'?: Linter.RuleEntry<[]>
  /**
   * A new session should be created during user authentication
   * @see https://sonarsource.github.io/rspec/#/rspec/S5876/javascript
   */
  'sonarjs/session-regeneration'?: Linter.RuleEntry<[]>
  /**
   * Shorthand object properties should be grouped at the beginning or end of an object declaration
   * @see https://sonarsource.github.io/rspec/#/rspec/S3499/javascript
   */
  'sonarjs/shorthand-property-grouping'?: Linter.RuleEntry<[]>
  /**
   * Character classes in regular expressions should not contain only one character
   * @see https://sonarsource.github.io/rspec/#/rspec/S6397/javascript
   */
  'sonarjs/single-char-in-character-classes'?: Linter.RuleEntry<[]>
  /**
   * Single-character alternations in regular expressions should be replaced with character classes
   * @see https://sonarsource.github.io/rspec/#/rspec/S6035/javascript
   */
  'sonarjs/single-character-alternation'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not cause catastrophic backtracking
   * @see https://sonarsource.github.io/rspec/#/rspec/S5852/javascript
   */
  'sonarjs/slow-regex'?: Linter.RuleEntry<[]>
  /**
   * SQL queries should not be dynamically formatted
   * @see https://sonarsource.github.io/rspec/#/rspec/S2077/javascript
   */
  'sonarjs/sql-queries'?: Linter.RuleEntry<[]>
  /**
   * Tests should be stable
   * @see https://sonarsource.github.io/rspec/#/rspec/S5973/javascript
   */
  'sonarjs/stable-tests'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions with the global flag should be used with caution
   * @see https://sonarsource.github.io/rspec/#/rspec/S6351/javascript
   */
  'sonarjs/stateful-regex'?: Linter.RuleEntry<[]>
  /**
   * HTTP Strict-Transport-Security policy should not be disabled
   * @see https://sonarsource.github.io/rspec/#/rspec/S5739/javascript
   */
  'sonarjs/strict-transport-security'?: Linter.RuleEntry<[]>
  /**
   * Comparison operators should not be used with strings
   * @see https://sonarsource.github.io/rspec/#/rspec/S3003/javascript
   */
  'sonarjs/strings-comparison'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions should not cause non-linear backtracking
   * @see https://sonarsource.github.io/rspec/#/rspec/S8786/javascript
   */
  'sonarjs/super-linear-regex'?: Linter.RuleEntry<[]>
  /**
   * Synchronous exception assertions should receive synchronous callbacks
   * @see https://sonarsource.github.io/rspec/#/rspec/S9072/javascript
   */
  'sonarjs/synchronous-exception-assertions'?: Linter.RuleEntry<[]>
  /**
   * Tests should not be registered asynchronously in suite callbacks
   * @see https://sonarsource.github.io/rspec/#/rspec/S8785/javascript
   */
  'sonarjs/synchronous-suite-callback'?: Linter.RuleEntry<[]>
  /**
   * Tables should have headers
   * @see https://sonarsource.github.io/rspec/#/rspec/S5256/javascript
   */
  'sonarjs/table-header'?: Linter.RuleEntry<[]>
  /**
   * Table cells should reference their headers
   * @see https://sonarsource.github.io/rspec/#/rspec/S5260/javascript
   */
  'sonarjs/table-header-reference'?: Linter.RuleEntry<[]>
  /**
   * Tests should check which exception is thrown
   * @see https://sonarsource.github.io/rspec/#/rspec/S5958/javascript
   */
  'sonarjs/test-check-exception'?: Linter.RuleEntry<[]>
  /**
   * Testing Library disappearance waits should use non-throwing queries
   * @see https://sonarsource.github.io/rspec/#/rspec/S9153/javascript
   */
  'sonarjs/testing-library-prefer-query-by-disappearance'?: Linter.RuleEntry<[]>
  /**
   * Testing Library queries should match presence assertions
   * @see https://sonarsource.github.io/rspec/#/rspec/S9027/javascript
   */
  'sonarjs/testing-library-query-assertion'?: Linter.RuleEntry<[]>
  /**
   * Track uses of "TODO" tags
   * @see https://sonarsource.github.io/rspec/#/rspec/S1135/javascript
   */
  'sonarjs/todo-tag'?: Linter.RuleEntry<[]>
  /**
   * Loops should not contain more than a single "break" or "continue" statement
   * @see https://sonarsource.github.io/rspec/#/rspec/S135/javascript
   */
  'sonarjs/too-many-break-or-continue-in-loop'?: Linter.RuleEntry<[]>
  /**
   * Regular expressions using Unicode character classes or property escapes should enable the unicode flag
   * @see https://sonarsource.github.io/rspec/#/rspec/S5867/javascript
   */
  'sonarjs/unicode-aware-regex'?: Linter.RuleEntry<[]>
  /**
   * Unnecessary imports should be removed
   * @see https://sonarsource.github.io/rspec/#/rspec/S1128/javascript
   */
  'sonarjs/unused-import'?: Linter.RuleEntry<[]>
  /**
   * Names of regular expressions named groups should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S5860/javascript
   */
  'sonarjs/unused-named-groups'?: Linter.RuleEntry<[]>
  /**
   * Server certificates should be verified during SSL/TLS connections
   * @see https://sonarsource.github.io/rspec/#/rspec/S4830/javascript
   */
  'sonarjs/unverified-certificate'?: Linter.RuleEntry<[]>
  /**
   * Server hostnames should be verified during SSL/TLS connections
   * @see https://sonarsource.github.io/rspec/#/rspec/S5527/javascript
   */
  'sonarjs/unverified-hostname'?: Linter.RuleEntry<[]>
  /**
   * "const" variables should not be reassigned
   * @see https://sonarsource.github.io/rspec/#/rspec/S3500/javascript
   */
  'sonarjs/updated-const-var'?: Linter.RuleEntry<[]>
  /**
   * Loop counters should not be assigned within the loop body
   * @see https://sonarsource.github.io/rspec/#/rspec/S2310/javascript
   */
  'sonarjs/updated-loop-counter'?: Linter.RuleEntry<[]>
  /**
   * Type aliases should be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4323/javascript
   */
  'sonarjs/use-type-alias'?: Linter.RuleEntry<[]>
  /**
   * Results of operations on strings should not be ignored
   * @see https://sonarsource.github.io/rspec/#/rspec/S1154/javascript
   * @deprecated
   */
  'sonarjs/useless-string-operation'?: Linter.RuleEntry<[]>
  /**
   * Values not convertible to numbers should not be used in numeric comparisons
   * @see https://sonarsource.github.io/rspec/#/rspec/S3758/javascript
   */
  'sonarjs/values-not-convertible-to-numbers'?: Linter.RuleEntry<[]>
  /**
   * Variable, property and parameter names should comply with a naming convention
   * @see https://sonarsource.github.io/rspec/#/rspec/S117/javascript
   */
  'sonarjs/variable-name'?: Linter.RuleEntry<SonarjsVariableName>
  /**
   * vi.mock should be declared at module scope
   * @see https://sonarsource.github.io/rspec/#/rspec/S9169/javascript
   */
  'sonarjs/vitest-mock-at-module-scope'?: Linter.RuleEntry<[]>
  /**
   * "void" should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S3735/javascript
   */
  'sonarjs/void-use'?: Linter.RuleEntry<[]>
  /**
   * Weak SSL/TLS protocols should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S4423/javascript
   */
  'sonarjs/weak-ssl'?: Linter.RuleEntry<[]>
  /**
   * Web SQL databases should not be used
   * @see https://sonarsource.github.io/rspec/#/rspec/S2817/javascript
   * @deprecated
   */
  'sonarjs/web-sql-database'?: Linter.RuleEntry<[]>
  /**
   * Web application technologies should not disclose version information
   * @see https://sonarsource.github.io/rspec/#/rspec/S5689/javascript
   */
  'sonarjs/x-powered-by'?: Linter.RuleEntry<[]>
  /**
   * XML parsers should not be vulnerable to XXE attacks
   * @see https://sonarsource.github.io/rspec/#/rspec/S2755/javascript
   */
  'sonarjs/xml-parser-xxe'?: Linter.RuleEntry<[]>
  /**
   * Enforce sorted `import` declarations within modules
   * @see https://eslint.org/docs/latest/rules/sort-imports
   */
  'sort-imports'?: Linter.RuleEntry<SortImports>
  /**
   * Require object keys to be sorted
   * @see https://eslint.org/docs/latest/rules/sort-keys
   */
  'sort-keys'?: Linter.RuleEntry<SortKeys>
  /**
   * Require variables within the same declaration block to be sorted
   * @see https://eslint.org/docs/latest/rules/sort-vars
   */
  'sort-vars'?: Linter.RuleEntry<SortVars>
  /**
   * Enforce consistent spacing before blocks
   * @see https://eslint.org/docs/latest/rules/space-before-blocks
   * @deprecated
   */
  'space-before-blocks'?: Linter.RuleEntry<SpaceBeforeBlocks>
  /**
   * Enforce consistent spacing before `function` definition opening parenthesis
   * @see https://eslint.org/docs/latest/rules/space-before-function-paren
   * @deprecated
   */
  'space-before-function-paren'?: Linter.RuleEntry<SpaceBeforeFunctionParen>
  /**
   * Enforce consistent spacing inside parentheses
   * @see https://eslint.org/docs/latest/rules/space-in-parens
   * @deprecated
   */
  'space-in-parens'?: Linter.RuleEntry<SpaceInParens>
  /**
   * Require spacing around infix operators
   * @see https://eslint.org/docs/latest/rules/space-infix-ops
   * @deprecated
   */
  'space-infix-ops'?: Linter.RuleEntry<SpaceInfixOps>
  /**
   * Enforce consistent spacing before or after unary operators
   * @see https://eslint.org/docs/latest/rules/space-unary-ops
   * @deprecated
   */
  'space-unary-ops'?: Linter.RuleEntry<SpaceUnaryOps>
  /**
   * Enforce consistent spacing after the `//` or `/*` in a comment
   * @see https://eslint.org/docs/latest/rules/spaced-comment
   * @deprecated
   */
  'spaced-comment'?: Linter.RuleEntry<SpacedComment>
  /**
   * Interactions should be awaited
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/await-interactions.md
   */
  'storybook/await-interactions'?: Linter.RuleEntry<[]>
  /**
   * Pass a context when invoking play function of another story
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/context-in-play-function.md
   */
  'storybook/context-in-play-function'?: Linter.RuleEntry<[]>
  /**
   * The component property should be set
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/csf-component.md
   */
  'storybook/csf-component'?: Linter.RuleEntry<[]>
  /**
   * Story files should have a default export
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/default-exports.md
   */
  'storybook/default-exports'?: Linter.RuleEntry<[]>
  /**
   * Deprecated hierarchy separator in title property
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/hierarchy-separator.md
   */
  'storybook/hierarchy-separator'?: Linter.RuleEntry<[]>
  /**
   * Meta should only have inline properties
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/meta-inline-properties.md
   */
  'storybook/meta-inline-properties'?: Linter.RuleEntry<StorybookMetaInlineProperties>
  /**
   * Meta should use `satisfies Meta`
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/meta-satisfies-type.md
   */
  'storybook/meta-satisfies-type'?: Linter.RuleEntry<[]>
  /**
   * A story should not have a redundant name property
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-redundant-story-name.md
   */
  'storybook/no-redundant-story-name'?: Linter.RuleEntry<[]>
  /**
   * Do not import renderer packages directly in stories
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-renderer-packages.md
   */
  'storybook/no-renderer-packages'?: Linter.RuleEntry<[]>
  /**
   * storiesOf is deprecated and should not be used
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-stories-of.md
   */
  'storybook/no-stories-of'?: Linter.RuleEntry<[]>
  /**
   * Do not define a title in meta
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-title-property-in-meta.md
   */
  'storybook/no-title-property-in-meta'?: Linter.RuleEntry<[]>
  /**
   * This rule identifies storybook addons that are invalid because they are either not installed or contain a typo in their name.
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/no-uninstalled-addons.md
   */
  'storybook/no-uninstalled-addons'?: Linter.RuleEntry<StorybookNoUninstalledAddons>
  /**
   * Stories should use PascalCase
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/prefer-pascal-case.md
   */
  'storybook/prefer-pascal-case'?: Linter.RuleEntry<[]>
  /**
   * A story file must contain at least one story export
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/story-exports.md
   */
  'storybook/story-exports'?: Linter.RuleEntry<[]>
  /**
   * Use expect from `@storybook/test`, `storybook/test` or `@storybook/jest`
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/use-storybook-expect.md
   */
  'storybook/use-storybook-expect'?: Linter.RuleEntry<[]>
  /**
   * Do not use testing-library directly on stories
   * @see https://github.com/storybookjs/storybook/blob/next/code/lib/eslint-plugin/docs/rules/use-storybook-testing-library.md
   */
  'storybook/use-storybook-testing-library'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow strict mode directives
   * @see https://eslint.org/docs/latest/rules/strict
   */
  'strict'?: Linter.RuleEntry<Strict>
  /**
   * disallow conditionals where the type is always truthy or always falsy
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/@typescript-eslint/no-unnecessary-condition/
   * @deprecated
   */
  'svelte/@typescript-eslint/no-unnecessary-condition'?: Linter.RuleEntry<SvelteTypescriptEslintNoUnnecessaryCondition>
  /**
   * disallows the use of languages other than those specified in the configuration for the lang attribute of `<script>` and `<style>` blocks.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/block-lang/
   */
  'svelte/block-lang'?: Linter.RuleEntry<SvelteBlockLang>
  /**
   * disallow usage of button without an explicit type attribute
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/button-has-type/
   */
  'svelte/button-has-type'?: Linter.RuleEntry<SvelteButtonHasType>
  /**
   * support comment-directives in HTML template
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/comment-directive/
   */
  'svelte/comment-directive'?: Linter.RuleEntry<SvelteCommentDirective>
  /**
   * enforce a consistent style for CSS selectors
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/consistent-selector-style/
   */
  'svelte/consistent-selector-style'?: Linter.RuleEntry<SvelteConsistentSelectorStyle>
  /**
   * derived store should use same variable names between values and callback
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/derived-has-same-inputs-outputs/
   */
  'svelte/derived-has-same-inputs-outputs'?: Linter.RuleEntry<[]>
  /**
   * require slot type declaration using the `$$Slots` interface
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/experimental-require-slot-types/
   */
  'svelte/experimental-require-slot-types'?: Linter.RuleEntry<[]>
  /**
   * require the strictEvents attribute on `<script>` tags
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/experimental-require-strict-events/
   */
  'svelte/experimental-require-strict-events'?: Linter.RuleEntry<[]>
  /**
   * enforce the location of first attribute
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/first-attribute-linebreak/
   */
  'svelte/first-attribute-linebreak'?: Linter.RuleEntry<SvelteFirstAttributeLinebreak>
  /**
   * Require or disallow a line break before tag's closing brackets
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/html-closing-bracket-new-line/
   */
  'svelte/html-closing-bracket-new-line'?: Linter.RuleEntry<SvelteHtmlClosingBracketNewLine>
  /**
   * require or disallow a space before tag's closing brackets
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/html-closing-bracket-spacing/
   */
  'svelte/html-closing-bracket-spacing'?: Linter.RuleEntry<SvelteHtmlClosingBracketSpacing>
  /**
   * enforce quotes style of HTML attributes
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/html-quotes/
   */
  'svelte/html-quotes'?: Linter.RuleEntry<SvelteHtmlQuotes>
  /**
   * enforce self-closing style
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/html-self-closing/
   */
  'svelte/html-self-closing'?: Linter.RuleEntry<SvelteHtmlSelfClosing>
  /**
   * enforce consistent indentation
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/indent/
   */
  'svelte/indent'?: Linter.RuleEntry<SvelteIndent>
  /**
   * Svelte runtime prevents calling the same reactive statement twice in a microtask. But between different microtask, it doesn't prevent.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/infinite-reactive-loop/
   */
  'svelte/infinite-reactive-loop'?: Linter.RuleEntry<[]>
  /**
   * enforce the maximum number of attributes per line
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/max-attributes-per-line/
   */
  'svelte/max-attributes-per-line'?: Linter.RuleEntry<SvelteMaxAttributesPerLine>
  /**
   * enforce maximum number of lines in svelte component blocks
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/max-lines-per-block/
   */
  'svelte/max-lines-per-block'?: Linter.RuleEntry<SvelteMaxLinesPerBlock>
  /**
   * enforce unified spacing in mustache
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/mustache-spacing/
   */
  'svelte/mustache-spacing'?: Linter.RuleEntry<SvelteMustacheSpacing>
  /**
   * Warns against the use of `addEventListener`
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-add-event-listener/
   */
  'svelte/no-add-event-listener'?: Linter.RuleEntry<[]>
  /**
   * disallow the use of `{@const}` in favor of `{const ...}` declaration tags
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-at-const-tags/
   */
  'svelte/no-at-const-tags'?: Linter.RuleEntry<[]>
  /**
   * disallow the use of `{@debug}`
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-at-debug-tags/
   */
  'svelte/no-at-debug-tags'?: Linter.RuleEntry<[]>
  /**
   * disallow use of `{@html}` to prevent XSS attack
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-at-html-tags/
   */
  'svelte/no-at-html-tags'?: Linter.RuleEntry<[]>
  /**
   * disallow useless `bind:value` on `<input type="checkbox">` and `<input type="radio">`
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-bind-value-on-checkable-inputs/
   */
  'svelte/no-bind-value-on-checkable-inputs'?: Linter.RuleEntry<[]>
  /**
   * disallow a `.svelte` component and a same-named runes module (e.g. `Foo.svelte` and `Foo.svelte.ts`) from coexisting
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-conflicting-module-names/
   */
  'svelte/no-conflicting-module-names'?: Linter.RuleEntry<[]>
  /**
   * disallow DOM manipulating
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-dom-manipulating/
   */
  'svelte/no-dom-manipulating'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate conditions in `{#if}` / `{:else if}` chains
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-dupe-else-if-blocks/
   */
  'svelte/no-dupe-else-if-blocks'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate `on:` directives
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-dupe-on-directives/
   */
  'svelte/no-dupe-on-directives'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate style properties
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-dupe-style-properties/
   */
  'svelte/no-dupe-style-properties'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate `use:` directives
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-dupe-use-directives/
   */
  'svelte/no-dupe-use-directives'?: Linter.RuleEntry<[]>
  /**
   * disallow dynamic slot name
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-dynamic-slot-name/
   * @deprecated
   */
  'svelte/no-dynamic-slot-name'?: Linter.RuleEntry<[]>
  /**
   * disallow exporting load functions in `*.svelte` module in SvelteKit page components.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-export-load-in-svelte-module-in-kit-pages/
   */
  'svelte/no-export-load-in-svelte-module-in-kit-pages'?: Linter.RuleEntry<[]>
  /**
   * disallow wrapping single reactive statements in curly braces
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-extra-reactive-curlies/
   */
  'svelte/no-extra-reactive-curlies'?: Linter.RuleEntry<[]>
  /**
   * disallow using goto() without the base path
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-goto-without-base/
   * @deprecated
   */
  'svelte/no-goto-without-base'?: Linter.RuleEntry<[]>
  /**
   * disallow ignoring the unsubscribe method returned by the `subscribe()` on Svelte stores.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-ignored-unsubscribe/
   */
  'svelte/no-ignored-unsubscribe'?: Linter.RuleEntry<[]>
  /**
   * disallow reactive statements that don't reference reactive values.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-immutable-reactive-statements/
   */
  'svelte/no-immutable-reactive-statements'?: Linter.RuleEntry<[]>
  /**
   * disallow attributes and directives that produce inline styles
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-inline-styles/
   */
  'svelte/no-inline-styles'?: Linter.RuleEntry<SvelteNoInlineStyles>
  /**
   * disallow variable or `function` declarations in nested blocks
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-inner-declarations/
   */
  'svelte/no-inner-declarations'?: Linter.RuleEntry<SvelteNoInnerDeclarations>
  /**
   * Warns against the use of `$inspect` directive
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-inspect/
   */
  'svelte/no-inspect'?: Linter.RuleEntry<[]>
  /**
   * disallow using navigation (links, goto, pushState, replaceState) without the base path
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-navigation-without-base/
   * @deprecated
   */
  'svelte/no-navigation-without-base'?: Linter.RuleEntry<SvelteNoNavigationWithoutBase>
  /**
   * disallow internal navigation (links, `goto()`, `pushState()`, `replaceState()`) without a `resolve()`
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-navigation-without-resolve/
   */
  'svelte/no-navigation-without-resolve'?: Linter.RuleEntry<SvelteNoNavigationWithoutResolve>
  /**
   * disallow `<style>` elements nested inside other elements or blocks
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-nested-style-tag/
   */
  'svelte/no-nested-style-tag'?: Linter.RuleEntry<[]>
  /**
   * disallow use of not function in event handler
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-not-function-handler/
   */
  'svelte/no-not-function-handler'?: Linter.RuleEntry<[]>
  /**
   * disallow objects in text mustache interpolation
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-object-in-text-mustaches/
   */
  'svelte/no-object-in-text-mustaches'?: Linter.RuleEntry<[]>
  /**
   * Checks for invalid raw HTML elements
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-raw-special-elements/
   */
  'svelte/no-raw-special-elements'?: Linter.RuleEntry<[]>
  /**
   * it's not necessary to define functions in reactive statements
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-reactive-functions/
   */
  'svelte/no-reactive-functions'?: Linter.RuleEntry<[]>
  /**
   * don't assign literal values in reactive statements
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-reactive-literals/
   */
  'svelte/no-reactive-literals'?: Linter.RuleEntry<[]>
  /**
   * disallow reassigning reactive values
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-reactive-reassign/
   */
  'svelte/no-reactive-reassign'?: Linter.RuleEntry<SvelteNoReactiveReassign>
  /**
   * disallow specific HTML elements
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-restricted-html-elements/
   */
  'svelte/no-restricted-html-elements'?: Linter.RuleEntry<SvelteNoRestrictedHtmlElements>
  /**
   * disallow shorthand style properties that override related longhand properties
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-shorthand-style-property-overrides/
   */
  'svelte/no-shorthand-style-property-overrides'?: Linter.RuleEntry<[]>
  /**
   * disallow spaces around equal signs in attribute
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-spaces-around-equal-signs-in-attribute/
   */
  'svelte/no-spaces-around-equal-signs-in-attribute'?: Linter.RuleEntry<[]>
  /**
   * disallow using async/await inside svelte stores because it causes issues with the auto-unsubscribing features
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-store-async/
   */
  'svelte/no-store-async'?: Linter.RuleEntry<[]>
  /**
   * svelte/internal will be removed in Svelte 6.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-svelte-internal/
   */
  'svelte/no-svelte-internal'?: Linter.RuleEntry<[]>
  /**
   * disallow `target="_blank"` attribute without `rel="noopener noreferrer"`
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-target-blank/
   */
  'svelte/no-target-blank'?: Linter.RuleEntry<SvelteNoTargetBlank>
  /**
   * disallow using top-level browser global variables
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-top-level-browser-globals/
   */
  'svelte/no-top-level-browser-globals'?: Linter.RuleEntry<[]>
  /**
   * disallow trailing whitespace at the end of lines
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-trailing-spaces/
   */
  'svelte/no-trailing-spaces'?: Linter.RuleEntry<SvelteNoTrailingSpaces>
  /**
   * disallow unknown `style:property`
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-unknown-style-directive-property/
   */
  'svelte/no-unknown-style-directive-property'?: Linter.RuleEntry<SvelteNoUnknownStyleDirectiveProperty>
  /**
   * Disallow unnecessary $state wrapping of reactive classes
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-unnecessary-state-wrap/
   */
  'svelte/no-unnecessary-state-wrap'?: Linter.RuleEntry<SvelteNoUnnecessaryStateWrap>
  /**
   * disallow the use of a class in the template without a corresponding style
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-unused-class-name/
   */
  'svelte/no-unused-class-name'?: Linter.RuleEntry<SvelteNoUnusedClassName>
  /**
   * Warns about defined Props properties that are unused
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-unused-props/
   */
  'svelte/no-unused-props'?: Linter.RuleEntry<SvelteNoUnusedProps>
  /**
   * disallow unused svelte-ignore comments
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-unused-svelte-ignore/
   */
  'svelte/no-unused-svelte-ignore'?: Linter.RuleEntry<[]>
  /**
   * disallow explicit children snippet where it's not needed
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-useless-children-snippet/
   */
  'svelte/no-useless-children-snippet'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary mustache interpolations
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/no-useless-mustaches/
   */
  'svelte/no-useless-mustaches'?: Linter.RuleEntry<SvelteNoUselessMustaches>
  /**
   * require attribute interpolation instead of template literals
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-attribute-interpolation/
   */
  'svelte/prefer-attribute-interpolation'?: Linter.RuleEntry<[]>
  /**
   * require class directives instead of ternary expressions
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-class-directive/
   */
  'svelte/prefer-class-directive'?: Linter.RuleEntry<SveltePreferClassDirective>
  /**
   * Require `const` declarations for variables that are never reassigned after declared
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-const/
   */
  'svelte/prefer-const'?: Linter.RuleEntry<SveltePreferConst>
  /**
   * disallow unnecessary `$derived.by()` when `$derived()` is sufficient
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-derived-over-derived-by/
   */
  'svelte/prefer-derived-over-derived-by'?: Linter.RuleEntry<[]>
  /**
   * destructure values from object stores for better change tracking & fewer redraws
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-destructured-store-props/
   */
  'svelte/prefer-destructured-store-props'?: Linter.RuleEntry<[]>
  /**
   * require style directives instead of style attribute
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-style-directive/
   */
  'svelte/prefer-style-directive'?: Linter.RuleEntry<[]>
  /**
   * disallow using mutable instances of built-in classes where a reactive alternative is provided by svelte/reactivity
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-svelte-reactivity/
   */
  'svelte/prefer-svelte-reactivity'?: Linter.RuleEntry<[]>
  /**
   * Prefer using writable $derived instead of $state and $effect
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-writable-derived/
   */
  'svelte/prefer-writable-derived'?: Linter.RuleEntry<[]>
  /**
   * require keyed `{#each}` block
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/require-each-key/
   */
  'svelte/require-each-key'?: Linter.RuleEntry<[]>
  /**
   * require type parameters for `createEventDispatcher`
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/require-event-dispatcher-types/
   */
  'svelte/require-event-dispatcher-types'?: Linter.RuleEntry<[]>
  /**
   * require component event names to start with "on"
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/require-event-prefix/
   */
  'svelte/require-event-prefix'?: Linter.RuleEntry<SvelteRequireEventPrefix>
  /**
   * require style attributes that can be optimized
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/require-optimized-style-attribute/
   */
  'svelte/require-optimized-style-attribute'?: Linter.RuleEntry<[]>
  /**
   * store callbacks must use `set` param
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/require-store-callbacks-use-set-param/
   */
  'svelte/require-store-callbacks-use-set-param'?: Linter.RuleEntry<[]>
  /**
   * disallow to use of the store itself as an operand. Need to use $ prefix or get function.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/require-store-reactive-access/
   */
  'svelte/require-store-reactive-access'?: Linter.RuleEntry<[]>
  /**
   * require initial value in store
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/require-stores-init/
   */
  'svelte/require-stores-init'?: Linter.RuleEntry<[]>
  /**
   * enforce use of shorthand syntax in attribute
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/shorthand-attribute/
   */
  'svelte/shorthand-attribute'?: Linter.RuleEntry<SvelteShorthandAttribute>
  /**
   * enforce use of shorthand syntax in directives
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/shorthand-directive/
   */
  'svelte/shorthand-directive'?: Linter.RuleEntry<SvelteShorthandDirective>
  /**
   * enforce order of attributes
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/sort-attributes/
   */
  'svelte/sort-attributes'?: Linter.RuleEntry<SvelteSortAttributes>
  /**
   * enforce consistent spacing after the `<!--` and before the `-->` in a HTML comment
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/spaced-html-comment/
   */
  'svelte/spaced-html-comment'?: Linter.RuleEntry<SvelteSpacedHtmlComment>
  /**
   * system rule for working this plugin
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/system/
   */
  'svelte/system'?: Linter.RuleEntry<[]>
  /**
   * disallow warnings when compiling.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/valid-compile/
   */
  'svelte/valid-compile'?: Linter.RuleEntry<SvelteValidCompile>
  /**
   * enforce keys to use variables defined in the `{#each}` block
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/valid-each-key/
   */
  'svelte/valid-each-key'?: Linter.RuleEntry<[]>
  /**
   * disallow invalid props in SvelteKit route components.
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/valid-prop-names-in-kit-pages/
   */
  'svelte/valid-prop-names-in-kit-pages'?: Linter.RuleEntry<[]>
  /**
   * require valid style element parsing
   * @see https://sveltejs.github.io/eslint-plugin-svelte/rules/valid-style-parse/
   */
  'svelte/valid-style-parse'?: Linter.RuleEntry<[]>
  /**
   * Enforce spacing around colons of switch statements
   * @see https://eslint.org/docs/latest/rules/switch-colon-spacing
   * @deprecated
   */
  'switch-colon-spacing'?: Linter.RuleEntry<SwitchColonSpacing>
  /**
   * Require symbol descriptions
   * @see https://eslint.org/docs/latest/rules/symbol-description
   */
  'symbol-description'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing around embedded expressions of template strings
   * @see https://eslint.org/docs/latest/rules/template-curly-spacing
   * @deprecated
   */
  'template-curly-spacing'?: Linter.RuleEntry<TemplateCurlySpacing>
  /**
   * Require or disallow spacing between template tags and their literals
   * @see https://eslint.org/docs/latest/rules/template-tag-spacing
   * @deprecated
   */
  'template-tag-spacing'?: Linter.RuleEntry<TemplateTagSpacing>
  /**
   * Require or disallow Unicode byte order mark (BOM)
   * @see https://eslint.org/docs/latest/rules/unicode-bom
   */
  'unicode-bom'?: Linter.RuleEntry<UnicodeBom>
  /**
   * Disallow unused variables
   * @see https://github.com/sweepline/eslint-plugin-unused-imports/blob/master/docs/rules/no-unused-imports.md
   */
  'unused-imports/no-unused-imports'?: Linter.RuleEntry<UnusedImportsNoUnusedImports>
  /**
   * Disallow unused variables
   * @see https://github.com/sweepline/eslint-plugin-unused-imports/blob/master/docs/rules/no-unused-vars.md
   */
  'unused-imports/no-unused-vars'?: Linter.RuleEntry<UnusedImportsNoUnusedVars>
  /**
   * Require calls to `isNaN()` when checking for `NaN`
   * @see https://eslint.org/docs/latest/rules/use-isnan
   */
  'use-isnan'?: Linter.RuleEntry<UseIsnan>
  /**
   * Enforce comparing `typeof` expressions against valid strings
   * @see https://eslint.org/docs/latest/rules/valid-typeof
   */
  'valid-typeof'?: Linter.RuleEntry<ValidTypeof>
  /**
   * Require `var` declarations be placed at the top of their containing scope
   * @see https://eslint.org/docs/latest/rules/vars-on-top
   */
  'vars-on-top'?: Linter.RuleEntry<[]>
  /**
   * enforce using `.each` or `.for` consistently
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-each-for.md
   */
  'vitest/consistent-each-for'?: Linter.RuleEntry<VitestConsistentEachFor>
  /**
   * require test file pattern
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-test-filename.md
   */
  'vitest/consistent-test-filename'?: Linter.RuleEntry<VitestConsistentTestFilename>
  /**
   * enforce using test or it but not both
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-test-it.md
   */
  'vitest/consistent-test-it'?: Linter.RuleEntry<VitestConsistentTestIt>
  /**
   * enforce using vitest or vi but not both
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/consistent-vitest-vi.md
   */
  'vitest/consistent-vitest-vi'?: Linter.RuleEntry<VitestConsistentVitestVi>
  /**
   * enforce having expectation in test body
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/expect-expect.md
   */
  'vitest/expect-expect'?: Linter.RuleEntry<VitestExpectExpect>
  /**
   * enforce hoisted APIs to be on top of the file
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/hoisted-apis-on-top.md
   */
  'vitest/hoisted-apis-on-top'?: Linter.RuleEntry<[]>
  /**
   * enforce a maximum number of expect per test
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/max-expects.md
   */
  'vitest/max-expects'?: Linter.RuleEntry<VitestMaxExpects>
  /**
   * require describe block to be less than set max value or default value
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/max-nested-describe.md
   */
  'vitest/max-nested-describe'?: Linter.RuleEntry<VitestMaxNestedDescribe>
  /**
   * disallow alias methods
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-alias-methods.md
   */
  'vitest/no-alias-methods'?: Linter.RuleEntry<[]>
  /**
   * disallow commented out tests
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-commented-out-tests.md
   */
  'vitest/no-commented-out-tests'?: Linter.RuleEntry<[]>
  /**
   * disallow conditional expects
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-conditional-expect.md
   */
  'vitest/no-conditional-expect'?: Linter.RuleEntry<VitestNoConditionalExpect>
  /**
   * disallow conditional tests
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-conditional-in-test.md
   */
  'vitest/no-conditional-in-test'?: Linter.RuleEntry<[]>
  /**
   * disallow conditional tests
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-conditional-tests.md
   */
  'vitest/no-conditional-tests'?: Linter.RuleEntry<[]>
  /**
   * disallow disabled tests
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-disabled-tests.md
   */
  'vitest/no-disabled-tests'?: Linter.RuleEntry<[]>
  /**
   * disallow using a callback in asynchronous tests and hooks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-done-callback.md
   * @deprecated
   */
  'vitest/no-done-callback'?: Linter.RuleEntry<[]>
  /**
   * disallow duplicate hooks and teardown hooks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-duplicate-hooks.md
   */
  'vitest/no-duplicate-hooks'?: Linter.RuleEntry<[]>
  /**
   * disallow focused tests
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-focused-tests.md
   */
  'vitest/no-focused-tests'?: Linter.RuleEntry<VitestNoFocusedTests>
  /**
   * disallow setup and teardown hooks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-hooks.md
   */
  'vitest/no-hooks'?: Linter.RuleEntry<VitestNoHooks>
  /**
   * disallow identical titles
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-identical-title.md
   */
  'vitest/no-identical-title'?: Linter.RuleEntry<[]>
  /**
   * disallow importing `node:test`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-import-node-test.md
   */
  'vitest/no-import-node-test'?: Linter.RuleEntry<[]>
  /**
   * disallow importing Vitest globals
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-importing-vitest-globals.md
   */
  'vitest/no-importing-vitest-globals'?: Linter.RuleEntry<[]>
  /**
   * disallow string interpolation in snapshots
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-interpolation-in-snapshots.md
   */
  'vitest/no-interpolation-in-snapshots'?: Linter.RuleEntry<[]>
  /**
   * disallow large snapshots
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-large-snapshots.md
   */
  'vitest/no-large-snapshots'?: Linter.RuleEntry<VitestNoLargeSnapshots>
  /**
   * disallow importing from __mocks__ directory
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-mocks-import.md
   */
  'vitest/no-mocks-import'?: Linter.RuleEntry<[]>
  /**
   * disallow the use of certain matchers
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-restricted-matchers.md
   */
  'vitest/no-restricted-matchers'?: Linter.RuleEntry<VitestNoRestrictedMatchers>
  /**
   * disallow specific `vi.` methods
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-restricted-vi-methods.md
   */
  'vitest/no-restricted-vi-methods'?: Linter.RuleEntry<VitestNoRestrictedViMethods>
  /**
   * disallow using `expect` outside of `it` or `test` blocks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-standalone-expect.md
   */
  'vitest/no-standalone-expect'?: Linter.RuleEntry<VitestNoStandaloneExpect>
  /**
   * disallow using the `f` and `x` prefixes in favour of `.only` and `.skip`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-test-prefixes.md
   */
  'vitest/no-test-prefixes'?: Linter.RuleEntry<[]>
  /**
   * disallow return statements in tests
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-test-return-statement.md
   */
  'vitest/no-test-return-statement'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary async function wrapper for expected promises
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-unneeded-async-expect-function.md
   */
  'vitest/no-unneeded-async-expect-function'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `afterAll` blocks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/padding-around-after-all-blocks.md
   */
  'vitest/padding-around-after-all-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `afterEach` blocks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/padding-around-after-each-blocks.md
   */
  'vitest/padding-around-after-each-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around vitest functions
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/padding-around-all.md
   */
  'vitest/padding-around-all'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `beforeAll` blocks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/padding-around-before-all-blocks.md
   */
  'vitest/padding-around-before-all-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `beforeEach` blocks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/padding-around-before-each-blocks.md
   */
  'vitest/padding-around-before-each-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `describe` blocks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/padding-around-describe-blocks.md
   */
  'vitest/padding-around-describe-blocks'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `expect` groups
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/padding-around-expect-groups.md
   */
  'vitest/padding-around-expect-groups'?: Linter.RuleEntry<[]>
  /**
   * Enforce padding around `test` blocks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/padding-around-test-blocks.md
   */
  'vitest/padding-around-test-blocks'?: Linter.RuleEntry<[]>
  /**
   * Prefer `toHaveBeenCalledExactlyOnceWith` over `toHaveBeenCalledOnce` and `toHaveBeenCalledWith`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-called-exactly-once-with.md
   */
  'vitest/prefer-called-exactly-once-with'?: Linter.RuleEntry<[]>
  /**
   * enforce using `toBeCalledOnce()` or `toHaveBeenCalledOnce()`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-called-once.md
   */
  'vitest/prefer-called-once'?: Linter.RuleEntry<[]>
  /**
   * enforce using `toBeCalledTimes(1)` or `toHaveBeenCalledTimes(1)`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-called-times.md
   */
  'vitest/prefer-called-times'?: Linter.RuleEntry<[]>
  /**
   * enforce using `toBeCalledWith()` or `toHaveBeenCalledWith()`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-called-with.md
   */
  'vitest/prefer-called-with'?: Linter.RuleEntry<[]>
  /**
   * enforce using the built-in comparison matchers
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-comparison-matcher.md
   */
  'vitest/prefer-comparison-matcher'?: Linter.RuleEntry<[]>
  /**
   * enforce using a function as a describe title over an equivalent string
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-describe-function-title.md
   */
  'vitest/prefer-describe-function-title'?: Linter.RuleEntry<[]>
  /**
   * enforce using `each` rather than manual loops
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-each.md
   */
  'vitest/prefer-each'?: Linter.RuleEntry<[]>
  /**
   * enforce using the built-in equality matchers
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-equality-matcher.md
   */
  'vitest/prefer-equality-matcher'?: Linter.RuleEntry<[]>
  /**
   * enforce using expect assertions instead of callbacks
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-expect-assertions.md
   */
  'vitest/prefer-expect-assertions'?: Linter.RuleEntry<VitestPreferExpectAssertions>
  /**
   * enforce using `expect().resolves` over `expect(await ...)` syntax
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-expect-resolves.md
   */
  'vitest/prefer-expect-resolves'?: Linter.RuleEntry<[]>
  /**
   * enforce using `expect(...).toBeTypeOf(...)` instead of `expect(typeof ...).toBe(...)`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-expect-type-of.md
   */
  'vitest/prefer-expect-type-of'?: Linter.RuleEntry<[]>
  /**
   * enforce having hooks in consistent order
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-hooks-in-order.md
   */
  'vitest/prefer-hooks-in-order'?: Linter.RuleEntry<[]>
  /**
   * enforce having hooks before any test cases
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-hooks-on-top.md
   */
  'vitest/prefer-hooks-on-top'?: Linter.RuleEntry<[]>
  /**
   * prefer dynamic import in mock
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-import-in-mock.md
   */
  'vitest/prefer-import-in-mock'?: Linter.RuleEntry<VitestPreferImportInMock>
  /**
   * enforce importing Vitest globals
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-importing-vitest-globals.md
   */
  'vitest/prefer-importing-vitest-globals'?: Linter.RuleEntry<[]>
  /**
   * enforce lowercase titles
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-lowercase-title.md
   */
  'vitest/prefer-lowercase-title'?: Linter.RuleEntry<VitestPreferLowercaseTitle>
  /**
   * enforce mock resolved/rejected shorthands for promises
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-mock-promise-shorthand.md
   */
  'vitest/prefer-mock-promise-shorthand'?: Linter.RuleEntry<[]>
  /**
   * Prefer mock return shorthands
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-mock-return-shorthand.md
   */
  'vitest/prefer-mock-return-shorthand'?: Linter.RuleEntry<[]>
  /**
   * enforce including a hint with external snapshots
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-snapshot-hint.md
   */
  'vitest/prefer-snapshot-hint'?: Linter.RuleEntry<VitestPreferSnapshotHint>
  /**
   * enforce using `vi.spyOn`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-spy-on.md
   */
  'vitest/prefer-spy-on'?: Linter.RuleEntry<[]>
  /**
   * enforce using `toBe(true)` and `toBe(false)` over matchers that coerce types to boolean
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-strict-boolean-matchers.md
   */
  'vitest/prefer-strict-boolean-matchers'?: Linter.RuleEntry<[]>
  /**
   * enforce strict equal over equal
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-strict-equal.md
   */
  'vitest/prefer-strict-equal'?: Linter.RuleEntry<[]>
  /**
   * enforce using toBe()
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-to-be.md
   */
  'vitest/prefer-to-be'?: Linter.RuleEntry<[]>
  /**
   * enforce using toBeFalsy()
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-to-be-falsy.md
   */
  'vitest/prefer-to-be-falsy'?: Linter.RuleEntry<[]>
  /**
   * enforce using toBeObject()
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-to-be-object.md
   */
  'vitest/prefer-to-be-object'?: Linter.RuleEntry<[]>
  /**
   * enforce using `toBeTruthy`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-to-be-truthy.md
   */
  'vitest/prefer-to-be-truthy'?: Linter.RuleEntry<[]>
  /**
   * enforce using toContain()
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-to-contain.md
   */
  'vitest/prefer-to-contain'?: Linter.RuleEntry<[]>
  /**
   * Suggest using `toHaveBeenCalledTimes()`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-to-have-been-called-times.md
   */
  'vitest/prefer-to-have-been-called-times'?: Linter.RuleEntry<[]>
  /**
   * enforce using toHaveLength()
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-to-have-length.md
   */
  'vitest/prefer-to-have-length'?: Linter.RuleEntry<[]>
  /**
   * enforce using `test.todo`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-todo.md
   */
  'vitest/prefer-todo'?: Linter.RuleEntry<[]>
  /**
   * require `vi.mocked()` over `fn as Mock`
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/prefer-vi-mocked.md
   */
  'vitest/prefer-vi-mocked'?: Linter.RuleEntry<[]>
  /**
   * ensure that every `expect.poll` call is awaited
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/require-awaited-expect-poll.md
   */
  'vitest/require-awaited-expect-poll'?: Linter.RuleEntry<[]>
  /**
   * require setup and teardown to be within a hook
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/require-hook.md
   */
  'vitest/require-hook'?: Linter.RuleEntry<VitestRequireHook>
  /**
   * require local Test Context for concurrent snapshot tests
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/require-local-test-context-for-concurrent-snapshots.md
   */
  'vitest/require-local-test-context-for-concurrent-snapshots'?: Linter.RuleEntry<[]>
  /**
   * enforce using type parameters with vitest mock functions
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/require-mock-type-parameters.md
   */
  'vitest/require-mock-type-parameters'?: Linter.RuleEntry<VitestRequireMockTypeParameters>
  /**
   * require tests to declare a timeout
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/require-test-timeout.md
   */
  'vitest/require-test-timeout'?: Linter.RuleEntry<[]>
  /**
   * require toThrow() to be called with an error message
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/require-to-throw-message.md
   */
  'vitest/require-to-throw-message'?: Linter.RuleEntry<[]>
  /**
   * enforce that all tests are in a top-level describe
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/require-top-level-describe.md
   */
  'vitest/require-top-level-describe'?: Linter.RuleEntry<VitestRequireTopLevelDescribe>
  /**
   * enforce unbound methods are called with their expected scope
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/unbound-method.md
   */
  'vitest/unbound-method'?: Linter.RuleEntry<VitestUnboundMethod>
  /**
   * enforce valid describe callback
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/valid-describe-callback.md
   */
  'vitest/valid-describe-callback'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `expect()` usage
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/valid-expect.md
   */
  'vitest/valid-expect'?: Linter.RuleEntry<VitestValidExpect>
  /**
   * require promises that have expectations in their chain to be valid
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/valid-expect-in-promise.md
   */
  'vitest/valid-expect-in-promise'?: Linter.RuleEntry<[]>
  /**
   * enforce valid titles
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/valid-title.md
   */
  'vitest/valid-title'?: Linter.RuleEntry<VitestValidTitle>
  /**
   * disallow `.todo` usage
   * @see https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/warn-todo.md
   */
  'vitest/warn-todo'?: Linter.RuleEntry<[]>
  /**
   * Enforce linebreaks after opening and before closing array brackets in `<template>`
   * @see https://eslint.vuejs.org/rules/array-bracket-newline.html
   */
  'vue/array-bracket-newline'?: Linter.RuleEntry<VueArrayBracketNewline>
  /**
   * Enforce consistent spacing inside array brackets in `<template>`
   * @see https://eslint.vuejs.org/rules/array-bracket-spacing.html
   */
  'vue/array-bracket-spacing'?: Linter.RuleEntry<VueArrayBracketSpacing>
  /**
   * Enforce line breaks after each array element in `<template>`
   * @see https://eslint.vuejs.org/rules/array-element-newline.html
   */
  'vue/array-element-newline'?: Linter.RuleEntry<VueArrayElementNewline>
  /**
   * Enforce consistent spacing before and after the arrow in arrow functions in `<template>`
   * @see https://eslint.vuejs.org/rules/arrow-spacing.html
   */
  'vue/arrow-spacing'?: Linter.RuleEntry<VueArrowSpacing>
  /**
   * enforce attribute naming style on custom components in template
   * @see https://eslint.vuejs.org/rules/attribute-hyphenation.html
   */
  'vue/attribute-hyphenation'?: Linter.RuleEntry<VueAttributeHyphenation>
  /**
   * enforce order of attributes
   * @see https://eslint.vuejs.org/rules/attributes-order.html
   */
  'vue/attributes-order'?: Linter.RuleEntry<VueAttributesOrder>
  /**
   * disallow use other than available `lang`
   * @see https://eslint.vuejs.org/rules/block-lang.html
   */
  'vue/block-lang'?: Linter.RuleEntry<VueBlockLang>
  /**
   * enforce order of component top-level elements
   * @see https://eslint.vuejs.org/rules/block-order.html
   */
  'vue/block-order'?: Linter.RuleEntry<VueBlockOrder>
  /**
   * Disallow or enforce spaces inside of blocks after opening block and before closing block in `<template>`
   * @see https://eslint.vuejs.org/rules/block-spacing.html
   */
  'vue/block-spacing'?: Linter.RuleEntry<VueBlockSpacing>
  /**
   * enforce line breaks after opening and before closing block-level tags
   * @see https://eslint.vuejs.org/rules/block-tag-newline.html
   */
  'vue/block-tag-newline'?: Linter.RuleEntry<VueBlockTagNewline>
  /**
   * Enforce consistent brace style for blocks in `<template>`
   * @see https://eslint.vuejs.org/rules/brace-style.html
   */
  'vue/brace-style'?: Linter.RuleEntry<VueBraceStyle>
  /**
   * Enforce camelcase naming convention in `<template>`
   * @see https://eslint.vuejs.org/rules/camelcase.html
   */
  'vue/camelcase'?: Linter.RuleEntry<VueCamelcase>
  /**
   * Require or disallow trailing commas in `<template>`
   * @see https://eslint.vuejs.org/rules/comma-dangle.html
   */
  'vue/comma-dangle'?: Linter.RuleEntry<VueCommaDangle>
  /**
   * Enforce consistent spacing before and after commas in `<template>`
   * @see https://eslint.vuejs.org/rules/comma-spacing.html
   */
  'vue/comma-spacing'?: Linter.RuleEntry<VueCommaSpacing>
  /**
   * Enforce consistent comma style in `<template>`
   * @see https://eslint.vuejs.org/rules/comma-style.html
   */
  'vue/comma-style'?: Linter.RuleEntry<VueCommaStyle>
  /**
   * support comment-directives in `<template>`
   * @see https://eslint.vuejs.org/rules/comment-directive.html
   */
  'vue/comment-directive'?: Linter.RuleEntry<VueCommentDirective>
  /**
   * enforce component API style
   * @see https://eslint.vuejs.org/rules/component-api-style.html
   */
  'vue/component-api-style'?: Linter.RuleEntry<VueComponentApiStyle>
  /**
   * enforce specific casing for component definition name
   * @see https://eslint.vuejs.org/rules/component-definition-name-casing.html
   */
  'vue/component-definition-name-casing'?: Linter.RuleEntry<VueComponentDefinitionNameCasing>
  /**
   * enforce specific casing for the component naming style in template
   * @see https://eslint.vuejs.org/rules/component-name-in-template-casing.html
   */
  'vue/component-name-in-template-casing'?: Linter.RuleEntry<VueComponentNameInTemplateCasing>
  /**
   * enforce the casing of component name in `components` options
   * @see https://eslint.vuejs.org/rules/component-options-name-casing.html
   */
  'vue/component-options-name-casing'?: Linter.RuleEntry<VueComponentOptionsNameCasing>
  /**
   * enforce specific casing for custom event name
   * @see https://eslint.vuejs.org/rules/custom-event-name-casing.html
   */
  'vue/custom-event-name-casing'?: Linter.RuleEntry<VueCustomEventNameCasing>
  /**
   * enforce declaration style of `defineEmits`
   * @see https://eslint.vuejs.org/rules/define-emits-declaration.html
   */
  'vue/define-emits-declaration'?: Linter.RuleEntry<VueDefineEmitsDeclaration>
  /**
   * enforce order of compiler macros (`defineProps`, `defineEmits`, etc.)
   * @see https://eslint.vuejs.org/rules/define-macros-order.html
   */
  'vue/define-macros-order'?: Linter.RuleEntry<VueDefineMacrosOrder>
  /**
   * enforce declaration style of `defineProps`
   * @see https://eslint.vuejs.org/rules/define-props-declaration.html
   */
  'vue/define-props-declaration'?: Linter.RuleEntry<VueDefinePropsDeclaration>
  /**
   * enforce consistent style for props destructuring
   * @see https://eslint.vuejs.org/rules/define-props-destructuring.html
   */
  'vue/define-props-destructuring'?: Linter.RuleEntry<VueDefinePropsDestructuring>
  /**
   * Enforce consistent newlines before and after dots in `<template>`
   * @see https://eslint.vuejs.org/rules/dot-location.html
   */
  'vue/dot-location'?: Linter.RuleEntry<VueDotLocation>
  /**
   * Enforce dot notation whenever possible in `<template>`
   * @see https://eslint.vuejs.org/rules/dot-notation.html
   */
  'vue/dot-notation'?: Linter.RuleEntry<VueDotNotation>
  /**
   * enforce or forbid the use of the `scoped` and `module` attributes in SFC top level style tags
   * @see https://eslint.vuejs.org/rules/enforce-style-attribute.html
   */
  'vue/enforce-style-attribute'?: Linter.RuleEntry<VueEnforceStyleAttribute>
  /**
   * Require the use of `===` and `!==` in `<template>`
   * @see https://eslint.vuejs.org/rules/eqeqeq.html
   */
  'vue/eqeqeq'?: Linter.RuleEntry<VueEqeqeq>
  /**
   * enforce the location of first attribute
   * @see https://eslint.vuejs.org/rules/first-attribute-linebreak.html
   */
  'vue/first-attribute-linebreak'?: Linter.RuleEntry<VueFirstAttributeLinebreak>
  /**
   * Require or disallow spacing between function identifiers and their invocations in `<template>`
   * @see https://eslint.vuejs.org/rules/func-call-spacing.html
   */
  'vue/func-call-spacing'?: Linter.RuleEntry<VueFuncCallSpacing>
  /**
   * disallow usage of button without an explicit type attribute
   * @see https://eslint.vuejs.org/rules/html-button-has-type.html
   */
  'vue/html-button-has-type'?: Linter.RuleEntry<VueHtmlButtonHasType>
  /**
   * require or disallow a line break before tag's closing brackets
   * @see https://eslint.vuejs.org/rules/html-closing-bracket-newline.html
   */
  'vue/html-closing-bracket-newline'?: Linter.RuleEntry<VueHtmlClosingBracketNewline>
  /**
   * require or disallow a space before tag's closing brackets
   * @see https://eslint.vuejs.org/rules/html-closing-bracket-spacing.html
   */
  'vue/html-closing-bracket-spacing'?: Linter.RuleEntry<VueHtmlClosingBracketSpacing>
  /**
   * enforce unified line break in HTML comments
   * @see https://eslint.vuejs.org/rules/html-comment-content-newline.html
   */
  'vue/html-comment-content-newline'?: Linter.RuleEntry<VueHtmlCommentContentNewline>
  /**
   * enforce unified spacing in HTML comments
   * @see https://eslint.vuejs.org/rules/html-comment-content-spacing.html
   */
  'vue/html-comment-content-spacing'?: Linter.RuleEntry<VueHtmlCommentContentSpacing>
  /**
   * enforce consistent indentation in HTML comments
   * @see https://eslint.vuejs.org/rules/html-comment-indent.html
   */
  'vue/html-comment-indent'?: Linter.RuleEntry<VueHtmlCommentIndent>
  /**
   * enforce end tag style
   * @see https://eslint.vuejs.org/rules/html-end-tags.html
   */
  'vue/html-end-tags'?: Linter.RuleEntry<[]>
  /**
   * enforce consistent indentation in `<template>`
   * @see https://eslint.vuejs.org/rules/html-indent.html
   */
  'vue/html-indent'?: Linter.RuleEntry<VueHtmlIndent>
  /**
   * enforce quotes style of HTML attributes
   * @see https://eslint.vuejs.org/rules/html-quotes.html
   */
  'vue/html-quotes'?: Linter.RuleEntry<VueHtmlQuotes>
  /**
   * enforce self-closing style
   * @see https://eslint.vuejs.org/rules/html-self-closing.html
   */
  'vue/html-self-closing'?: Linter.RuleEntry<VueHtmlSelfClosing>
  /**
   * prevent variables used in JSX to be marked as unused
   * @see https://eslint.vuejs.org/rules/jsx-uses-vars.html
   */
  'vue/jsx-uses-vars'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent spacing between property names and type annotations in types and interfaces in `<template>`
   * @see https://eslint.vuejs.org/rules/key-spacing.html
   */
  'vue/key-spacing'?: Linter.RuleEntry<VueKeySpacing>
  /**
   * Enforce consistent spacing before and after keywords in `<template>`
   * @see https://eslint.vuejs.org/rules/keyword-spacing.html
   */
  'vue/keyword-spacing'?: Linter.RuleEntry<VueKeywordSpacing>
  /**
   * require component name property to match its file name
   * @see https://eslint.vuejs.org/rules/match-component-file-name.html
   */
  'vue/match-component-file-name'?: Linter.RuleEntry<VueMatchComponentFileName>
  /**
   * require the registered component name to match the imported component name
   * @see https://eslint.vuejs.org/rules/match-component-import-name.html
   */
  'vue/match-component-import-name'?: Linter.RuleEntry<[]>
  /**
   * enforce the maximum number of attributes per line
   * @see https://eslint.vuejs.org/rules/max-attributes-per-line.html
   */
  'vue/max-attributes-per-line'?: Linter.RuleEntry<VueMaxAttributesPerLine>
  /**
   * enforce a maximum line length in `.vue` files
   * @see https://eslint.vuejs.org/rules/max-len.html
   */
  'vue/max-len'?: Linter.RuleEntry<VueMaxLen>
  /**
   * enforce maximum number of lines in Vue SFC blocks
   * @see https://eslint.vuejs.org/rules/max-lines-per-block.html
   */
  'vue/max-lines-per-block'?: Linter.RuleEntry<VueMaxLinesPerBlock>
  /**
   * enforce maximum number of props in Vue component
   * @see https://eslint.vuejs.org/rules/max-props.html
   */
  'vue/max-props'?: Linter.RuleEntry<VueMaxProps>
  /**
   * enforce maximum depth of template
   * @see https://eslint.vuejs.org/rules/max-template-depth.html
   */
  'vue/max-template-depth'?: Linter.RuleEntry<VueMaxTemplateDepth>
  /**
   * require component names to be always multi-word
   * @see https://eslint.vuejs.org/rules/multi-word-component-names.html
   */
  'vue/multi-word-component-names'?: Linter.RuleEntry<VueMultiWordComponentNames>
  /**
   * require a line break before and after the contents of a multiline element
   * @see https://eslint.vuejs.org/rules/multiline-html-element-content-newline.html
   */
  'vue/multiline-html-element-content-newline'?: Linter.RuleEntry<VueMultilineHtmlElementContentNewline>
  /**
   * Enforce newlines between operands of ternary expressions in `<template>`
   * @see https://eslint.vuejs.org/rules/multiline-ternary.html
   */
  'vue/multiline-ternary'?: Linter.RuleEntry<VueMultilineTernary>
  /**
   * enforce unified spacing in mustache interpolations
   * @see https://eslint.vuejs.org/rules/mustache-interpolation-spacing.html
   */
  'vue/mustache-interpolation-spacing'?: Linter.RuleEntry<VueMustacheInterpolationSpacing>
  /**
   * enforce new lines between multi-line properties in Vue components
   * @see https://eslint.vuejs.org/rules/new-line-between-multi-line-property.html
   */
  'vue/new-line-between-multi-line-property'?: Linter.RuleEntry<VueNewLineBetweenMultiLineProperty>
  /**
   * enforce Promise or callback style in `nextTick`
   * @see https://eslint.vuejs.org/rules/next-tick-style.html
   */
  'vue/next-tick-style'?: Linter.RuleEntry<VueNextTickStyle>
  /**
   * disallow using arrow functions to define watcher
   * @see https://eslint.vuejs.org/rules/no-arrow-functions-in-watch.html
   */
  'vue/no-arrow-functions-in-watch'?: Linter.RuleEntry<[]>
  /**
   * disallow asynchronous actions in computed properties
   * @see https://eslint.vuejs.org/rules/no-async-in-computed-properties.html
   */
  'vue/no-async-in-computed-properties'?: Linter.RuleEntry<VueNoAsyncInComputedProperties>
  /**
   * disallow the use of bare strings in `<template>`
   * @see https://eslint.vuejs.org/rules/no-bare-strings-in-template.html
   */
  'vue/no-bare-strings-in-template'?: Linter.RuleEntry<VueNoBareStringsInTemplate>
  /**
   * disallow boolean defaults
   * @see https://eslint.vuejs.org/rules/no-boolean-default.html
   */
  'vue/no-boolean-default'?: Linter.RuleEntry<VueNoBooleanDefault>
  /**
   * disallow element's child contents which would be overwritten by a directive like `v-html` or `v-text`
   * @see https://eslint.vuejs.org/rules/no-child-content.html
   */
  'vue/no-child-content'?: Linter.RuleEntry<VueNoChildContent>
  /**
   * disallow accessing computed properties in `data`
   * @see https://eslint.vuejs.org/rules/no-computed-properties-in-data.html
   */
  'vue/no-computed-properties-in-data'?: Linter.RuleEntry<[]>
  /**
   * Disallow the use of `console` in `<template>`
   * @see https://eslint.vuejs.org/rules/no-console.html
   */
  'vue/no-console'?: Linter.RuleEntry<VueNoConsole>
  /**
   * Disallow constant expressions in conditions in `<template>`
   * @see https://eslint.vuejs.org/rules/no-constant-condition.html
   */
  'vue/no-constant-condition'?: Linter.RuleEntry<VueNoConstantCondition>
  /**
   * disallow custom modifiers on v-model used on the component
   * @see https://eslint.vuejs.org/rules/no-custom-modifiers-on-v-model.html
   */
  'vue/no-custom-modifiers-on-v-model'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated object declaration on data (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-data-object-declaration.html
   */
  'vue/no-deprecated-data-object-declaration'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `$delete` and `$set` (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-delete-set.html
   */
  'vue/no-deprecated-delete-set'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `destroyed` and `beforeDestroy` lifecycle hooks (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-destroyed-lifecycle.html
   */
  'vue/no-deprecated-destroyed-lifecycle'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `$listeners` (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-dollar-listeners-api.html
   */
  'vue/no-deprecated-dollar-listeners-api'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `$scopedSlots` (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-dollar-scopedslots-api.html
   */
  'vue/no-deprecated-dollar-scopedslots-api'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated events api (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-events-api.html
   */
  'vue/no-deprecated-events-api'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated filters syntax (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-filter.html
   */
  'vue/no-deprecated-filter'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated the `functional` template (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-functional-template.html
   */
  'vue/no-deprecated-functional-template'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated the `is` attribute on HTML elements (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-html-element-is.html
   */
  'vue/no-deprecated-html-element-is'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `inline-template` attribute (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-inline-template.html
   */
  'vue/no-deprecated-inline-template'?: Linter.RuleEntry<[]>
  /**
   * disallow deprecated `model` definition (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-model-definition.html
   */
  'vue/no-deprecated-model-definition'?: Linter.RuleEntry<VueNoDeprecatedModelDefinition>
  /**
   * disallow deprecated `this` access in props default function (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-props-default-this.html
   */
  'vue/no-deprecated-props-default-this'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `tag` property on `RouterLink` (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-router-link-tag-prop.html
   */
  'vue/no-deprecated-router-link-tag-prop'?: Linter.RuleEntry<VueNoDeprecatedRouterLinkTagProp>
  /**
   * disallow deprecated `scope` attribute (in Vue.js 2.5.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-scope-attribute.html
   */
  'vue/no-deprecated-scope-attribute'?: Linter.RuleEntry<[]>
  /**
   * disallow deprecated `slot` attribute (in Vue.js 2.6.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-slot-attribute.html
   */
  'vue/no-deprecated-slot-attribute'?: Linter.RuleEntry<VueNoDeprecatedSlotAttribute>
  /**
   * disallow deprecated `slot-scope` attribute (in Vue.js 2.6.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-slot-scope-attribute.html
   */
  'vue/no-deprecated-slot-scope-attribute'?: Linter.RuleEntry<[]>
  /**
   * disallow use of deprecated `.sync` modifier on `v-bind` directive (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-v-bind-sync.html
   */
  'vue/no-deprecated-v-bind-sync'?: Linter.RuleEntry<[]>
  /**
   * disallow deprecated `v-is` directive (in Vue.js 3.1.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-v-is.html
   */
  'vue/no-deprecated-v-is'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `.native` modifiers (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-v-on-native-modifier.html
   */
  'vue/no-deprecated-v-on-native-modifier'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated number (keycode) modifiers (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-v-on-number-modifiers.html
   */
  'vue/no-deprecated-v-on-number-modifiers'?: Linter.RuleEntry<[]>
  /**
   * disallow using deprecated `Vue.config.keyCodes` (in Vue.js 3.0.0+)
   * @see https://eslint.vuejs.org/rules/no-deprecated-vue-config-keycodes.html
   */
  'vue/no-deprecated-vue-config-keycodes'?: Linter.RuleEntry<[]>
  /**
   * disallow duplication of field names
   * @see https://eslint.vuejs.org/rules/no-dupe-keys.html
   */
  'vue/no-dupe-keys'?: Linter.RuleEntry<VueNoDupeKeys>
  /**
   * disallow duplicate conditions in `v-if` / `v-else-if` chains
   * @see https://eslint.vuejs.org/rules/no-dupe-v-else-if.html
   */
  'vue/no-dupe-v-else-if'?: Linter.RuleEntry<[]>
  /**
   * enforce `inheritAttrs` to be set to `false` when using `v-bind="$attrs"`
   * @see https://eslint.vuejs.org/rules/no-duplicate-attr-inheritance.html
   */
  'vue/no-duplicate-attr-inheritance'?: Linter.RuleEntry<VueNoDuplicateAttrInheritance>
  /**
   * disallow duplication of attributes
   * @see https://eslint.vuejs.org/rules/no-duplicate-attributes.html
   */
  'vue/no-duplicate-attributes'?: Linter.RuleEntry<VueNoDuplicateAttributes>
  /**
   * disallow duplication of class names in class attributes
   * @see https://eslint.vuejs.org/rules/no-duplicate-class-names.html
   */
  'vue/no-duplicate-class-names'?: Linter.RuleEntry<[]>
  /**
   * disallow the `<template>` `<script>` `<style>` block to be empty
   * @see https://eslint.vuejs.org/rules/no-empty-component-block.html
   */
  'vue/no-empty-component-block'?: Linter.RuleEntry<[]>
  /**
   * Disallow empty destructuring patterns in `<template>`
   * @see https://eslint.vuejs.org/rules/no-empty-pattern.html
   */
  'vue/no-empty-pattern'?: Linter.RuleEntry<VueNoEmptyPattern>
  /**
   * disallow `export` in `<script setup>`
   * @see https://eslint.vuejs.org/rules/no-export-in-script-setup.html
   */
  'vue/no-export-in-script-setup'?: Linter.RuleEntry<[]>
  /**
   * disallow asynchronously registered `expose`
   * @see https://eslint.vuejs.org/rules/no-expose-after-await.html
   */
  'vue/no-expose-after-await'?: Linter.RuleEntry<[]>
  /**
   * Disallow unnecessary parentheses in `<template>`
   * @see https://eslint.vuejs.org/rules/no-extra-parens.html
   */
  'vue/no-extra-parens'?: Linter.RuleEntry<VueNoExtraParens>
  /**
   * Disallow shorthand type conversions in `<template>`
   * @see https://eslint.vuejs.org/rules/no-implicit-coercion.html
   */
  'vue/no-implicit-coercion'?: Linter.RuleEntry<VueNoImplicitCoercion>
  /**
   * disallow importing Vue compiler macros
   * @see https://eslint.vuejs.org/rules/no-import-compiler-macros.html
   */
  'vue/no-import-compiler-macros'?: Linter.RuleEntry<[]>
  /**
   * disallow irregular whitespace in `.vue` files
   * @see https://eslint.vuejs.org/rules/no-irregular-whitespace.html
   */
  'vue/no-irregular-whitespace'?: Linter.RuleEntry<VueNoIrregularWhitespace>
  /**
   * disallow asynchronously registered lifecycle hooks
   * @see https://eslint.vuejs.org/rules/no-lifecycle-after-await.html
   */
  'vue/no-lifecycle-after-await'?: Linter.RuleEntry<[]>
  /**
   * disallow object, array, and function literals in template
   * @see https://eslint.vuejs.org/rules/no-literals-in-template.html
   */
  'vue/no-literals-in-template'?: Linter.RuleEntry<VueNoLiteralsInTemplate>
  /**
   * disallow unnecessary `<template>`
   * @see https://eslint.vuejs.org/rules/no-lone-template.html
   */
  'vue/no-lone-template'?: Linter.RuleEntry<VueNoLoneTemplate>
  /**
   * Disallow literal numbers that lose precision in `<template>`
   * @see https://eslint.vuejs.org/rules/no-loss-of-precision.html
   */
  'vue/no-loss-of-precision'?: Linter.RuleEntry<[]>
  /**
   * disallow multiple spaces
   * @see https://eslint.vuejs.org/rules/no-multi-spaces.html
   */
  'vue/no-multi-spaces'?: Linter.RuleEntry<VueNoMultiSpaces>
  /**
   * disallow passing multiple objects in an array to class
   * @see https://eslint.vuejs.org/rules/no-multiple-objects-in-class.html
   */
  'vue/no-multiple-objects-in-class'?: Linter.RuleEntry<[]>
  /**
   * disallow passing multiple arguments to scoped slots
   * @see https://eslint.vuejs.org/rules/no-multiple-slot-args.html
   */
  'vue/no-multiple-slot-args'?: Linter.RuleEntry<[]>
  /**
   * disallow adding multiple root nodes to the template
   * @see https://eslint.vuejs.org/rules/no-multiple-template-root.html
   */
  'vue/no-multiple-template-root'?: Linter.RuleEntry<VueNoMultipleTemplateRoot>
  /**
   * disallow mutation of component props
   * @see https://eslint.vuejs.org/rules/no-mutating-props.html
   */
  'vue/no-mutating-props'?: Linter.RuleEntry<VueNoMutatingProps>
  /**
   * Disallow negated conditions in `<template>`
   * @see https://eslint.vuejs.org/rules/no-negated-condition.html
   */
  'vue/no-negated-condition'?: Linter.RuleEntry<[]>
  /**
   * disallow negated conditions in v-if/v-else
   * @see https://eslint.vuejs.org/rules/no-negated-v-if-condition.html
   */
  'vue/no-negated-v-if-condition'?: Linter.RuleEntry<[]>
  /**
   * disallow parsing errors in `<template>`
   * @see https://eslint.vuejs.org/rules/no-parsing-error.html
   */
  'vue/no-parsing-error'?: Linter.RuleEntry<VueNoParsingError>
  /**
   * disallow a potential typo in your component property
   * @see https://eslint.vuejs.org/rules/no-potential-component-option-typo.html
   */
  'vue/no-potential-component-option-typo'?: Linter.RuleEntry<VueNoPotentialComponentOptionTypo>
  /**
   * disallow use of value wrapped by `ref()` (Composition API) as an operand
   * @see https://eslint.vuejs.org/rules/no-ref-as-operand.html
   */
  'vue/no-ref-as-operand'?: Linter.RuleEntry<[]>
  /**
   * disallow usages of ref objects that can lead to loss of reactivity
   * @see https://eslint.vuejs.org/rules/no-ref-object-reactivity-loss.html
   */
  'vue/no-ref-object-reactivity-loss'?: Linter.RuleEntry<[]>
  /**
   * enforce props with default values to be optional
   * @see https://eslint.vuejs.org/rules/no-required-prop-with-default.html
   */
  'vue/no-required-prop-with-default'?: Linter.RuleEntry<VueNoRequiredPropWithDefault>
  /**
   * disallow the use of reserved names in component definitions
   * @see https://eslint.vuejs.org/rules/no-reserved-component-names.html
   */
  'vue/no-reserved-component-names'?: Linter.RuleEntry<VueNoReservedComponentNames>
  /**
   * disallow overwriting reserved keys
   * @see https://eslint.vuejs.org/rules/no-reserved-keys.html
   */
  'vue/no-reserved-keys'?: Linter.RuleEntry<VueNoReservedKeys>
  /**
   * disallow reserved names in props
   * @see https://eslint.vuejs.org/rules/no-reserved-props.html
   */
  'vue/no-reserved-props'?: Linter.RuleEntry<VueNoReservedProps>
  /**
   * disallow specific block
   * @see https://eslint.vuejs.org/rules/no-restricted-block.html
   */
  'vue/no-restricted-block'?: Linter.RuleEntry<VueNoRestrictedBlock>
  /**
   * disallow asynchronously called restricted methods
   * @see https://eslint.vuejs.org/rules/no-restricted-call-after-await.html
   */
  'vue/no-restricted-call-after-await'?: Linter.RuleEntry<VueNoRestrictedCallAfterAwait>
  /**
   * disallow specific classes in Vue components
   * @see https://eslint.vuejs.org/rules/no-restricted-class.html
   */
  'vue/no-restricted-class'?: Linter.RuleEntry<VueNoRestrictedClass>
  /**
   * disallow specific component names
   * @see https://eslint.vuejs.org/rules/no-restricted-component-names.html
   */
  'vue/no-restricted-component-names'?: Linter.RuleEntry<VueNoRestrictedComponentNames>
  /**
   * disallow specific component option
   * @see https://eslint.vuejs.org/rules/no-restricted-component-options.html
   */
  'vue/no-restricted-component-options'?: Linter.RuleEntry<VueNoRestrictedComponentOptions>
  /**
   * disallow specific custom event
   * @see https://eslint.vuejs.org/rules/no-restricted-custom-event.html
   */
  'vue/no-restricted-custom-event'?: Linter.RuleEntry<VueNoRestrictedCustomEvent>
  /**
   * disallow specific elements
   * @see https://eslint.vuejs.org/rules/no-restricted-html-elements.html
   */
  'vue/no-restricted-html-elements'?: Linter.RuleEntry<VueNoRestrictedHtmlElements>
  /**
   * disallow specific props
   * @see https://eslint.vuejs.org/rules/no-restricted-props.html
   */
  'vue/no-restricted-props'?: Linter.RuleEntry<VueNoRestrictedProps>
  /**
   * disallow specific attribute
   * @see https://eslint.vuejs.org/rules/no-restricted-static-attribute.html
   */
  'vue/no-restricted-static-attribute'?: Linter.RuleEntry<VueNoRestrictedStaticAttribute>
  /**
   * Disallow specified syntax in `<template>`
   * @see https://eslint.vuejs.org/rules/no-restricted-syntax.html
   */
  'vue/no-restricted-syntax'?: Linter.RuleEntry<VueNoRestrictedSyntax>
  /**
   * disallow specific argument in `v-bind`
   * @see https://eslint.vuejs.org/rules/no-restricted-v-bind.html
   */
  'vue/no-restricted-v-bind'?: Linter.RuleEntry<VueNoRestrictedVBind>
  /**
   * disallow specific argument in `v-on`
   * @see https://eslint.vuejs.org/rules/no-restricted-v-on.html
   */
  'vue/no-restricted-v-on'?: Linter.RuleEntry<VueNoRestrictedVOn>
  /**
   * disallow `v-if` directives on root element
   * @see https://eslint.vuejs.org/rules/no-root-v-if.html
   */
  'vue/no-root-v-if'?: Linter.RuleEntry<[]>
  /**
   * disallow usages that lose the reactivity of `props` passed to `setup`
   * @see https://eslint.vuejs.org/rules/no-setup-props-reactivity-loss.html
   */
  'vue/no-setup-props-reactivity-loss'?: Linter.RuleEntry<[]>
  /**
   * disallow the use of event names that collide with native web event names
   * @see https://eslint.vuejs.org/rules/no-shadow-native-events.html
   */
  'vue/no-shadow-native-events'?: Linter.RuleEntry<[]>
  /**
   * enforce component's data property to be a function
   * @see https://eslint.vuejs.org/rules/no-shared-component-data.html
   */
  'vue/no-shared-component-data'?: Linter.RuleEntry<[]>
  /**
   * disallow side effects in computed properties
   * @see https://eslint.vuejs.org/rules/no-side-effects-in-computed-properties.html
   */
  'vue/no-side-effects-in-computed-properties'?: Linter.RuleEntry<[]>
  /**
   * disallow spaces around equal signs in attribute
   * @see https://eslint.vuejs.org/rules/no-spaces-around-equal-signs-in-attribute.html
   */
  'vue/no-spaces-around-equal-signs-in-attribute'?: Linter.RuleEntry<[]>
  /**
   * Disallow sparse arrays in `<template>`
   * @see https://eslint.vuejs.org/rules/no-sparse-arrays.html
   */
  'vue/no-sparse-arrays'?: Linter.RuleEntry<[]>
  /**
   * disallow static inline `style` attributes
   * @see https://eslint.vuejs.org/rules/no-static-inline-styles.html
   */
  'vue/no-static-inline-styles'?: Linter.RuleEntry<VueNoStaticInlineStyles>
  /**
   * disallow `key` attribute on `<template>`
   * @see https://eslint.vuejs.org/rules/no-template-key.html
   */
  'vue/no-template-key'?: Linter.RuleEntry<[]>
  /**
   * disallow variable declarations from shadowing variables declared in the outer scope
   * @see https://eslint.vuejs.org/rules/no-template-shadow.html
   */
  'vue/no-template-shadow'?: Linter.RuleEntry<VueNoTemplateShadow>
  /**
   * disallow target="_blank" attribute without rel="noopener noreferrer"
   * @see https://eslint.vuejs.org/rules/no-template-target-blank.html
   */
  'vue/no-template-target-blank'?: Linter.RuleEntry<VueNoTemplateTargetBlank>
  /**
   * disallow mustaches in `<textarea>`
   * @see https://eslint.vuejs.org/rules/no-textarea-mustache.html
   */
  'vue/no-textarea-mustache'?: Linter.RuleEntry<[]>
  /**
   * disallow `this` usage in a `beforeRouteEnter` method
   * @see https://eslint.vuejs.org/rules/no-this-in-before-route-enter.html
   */
  'vue/no-this-in-before-route-enter'?: Linter.RuleEntry<[]>
  /**
   * disallow use of undefined components in `<template>`
   * @see https://eslint.vuejs.org/rules/no-undef-components.html
   */
  'vue/no-undef-components'?: Linter.RuleEntry<VueNoUndefComponents>
  /**
   * disallow use of undefined custom directives
   * @see https://eslint.vuejs.org/rules/no-undef-directives.html
   */
  'vue/no-undef-directives'?: Linter.RuleEntry<VueNoUndefDirectives>
  /**
   * disallow undefined properties
   * @see https://eslint.vuejs.org/rules/no-undef-properties.html
   */
  'vue/no-undef-properties'?: Linter.RuleEntry<VueNoUndefProperties>
  /**
   * disallow unsupported Vue.js syntax on the specified version
   * @see https://eslint.vuejs.org/rules/no-unsupported-features.html
   */
  'vue/no-unsupported-features'?: Linter.RuleEntry<VueNoUnsupportedFeatures>
  /**
   * disallow registering components that are not used inside templates
   * @see https://eslint.vuejs.org/rules/no-unused-components.html
   */
  'vue/no-unused-components'?: Linter.RuleEntry<VueNoUnusedComponents>
  /**
   * disallow unused emit declarations
   * @see https://eslint.vuejs.org/rules/no-unused-emit-declarations.html
   */
  'vue/no-unused-emit-declarations'?: Linter.RuleEntry<[]>
  /**
   * disallow unused properties
   * @see https://eslint.vuejs.org/rules/no-unused-properties.html
   */
  'vue/no-unused-properties'?: Linter.RuleEntry<VueNoUnusedProperties>
  /**
   * disallow unused refs
   * @see https://eslint.vuejs.org/rules/no-unused-refs.html
   */
  'vue/no-unused-refs'?: Linter.RuleEntry<[]>
  /**
   * disallow unused variable definitions of v-for directives or scope attributes
   * @see https://eslint.vuejs.org/rules/no-unused-vars.html
   */
  'vue/no-unused-vars'?: Linter.RuleEntry<VueNoUnusedVars>
  /**
   * disallow use computed property like method
   * @see https://eslint.vuejs.org/rules/no-use-computed-property-like-method.html
   */
  'vue/no-use-computed-property-like-method'?: Linter.RuleEntry<[]>
  /**
   * disallow using `v-else-if`/`v-else` on the same element as `v-for`
   * @see https://eslint.vuejs.org/rules/no-use-v-else-with-v-for.html
   */
  'vue/no-use-v-else-with-v-for'?: Linter.RuleEntry<[]>
  /**
   * disallow using `v-if` on the same element as `v-for`
   * @see https://eslint.vuejs.org/rules/no-use-v-if-with-v-for.html
   */
  'vue/no-use-v-if-with-v-for'?: Linter.RuleEntry<VueNoUseVIfWithVFor>
  /**
   * Disallow unnecessary concatenation of literals or template literals in `<template>`
   * @see https://eslint.vuejs.org/rules/no-useless-concat.html
   */
  'vue/no-useless-concat'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary mustache interpolations
   * @see https://eslint.vuejs.org/rules/no-useless-mustaches.html
   */
  'vue/no-useless-mustaches'?: Linter.RuleEntry<VueNoUselessMustaches>
  /**
   * disallow useless attribute on `<template>`
   * @see https://eslint.vuejs.org/rules/no-useless-template-attributes.html
   */
  'vue/no-useless-template-attributes'?: Linter.RuleEntry<[]>
  /**
   * disallow unnecessary `v-bind` directives
   * @see https://eslint.vuejs.org/rules/no-useless-v-bind.html
   */
  'vue/no-useless-v-bind'?: Linter.RuleEntry<VueNoUselessVBind>
  /**
   * disallow `key` attribute on `<template v-for>`
   * @see https://eslint.vuejs.org/rules/no-v-for-template-key.html
   * @deprecated
   */
  'vue/no-v-for-template-key'?: Linter.RuleEntry<[]>
  /**
   * disallow key of `<template v-for>` placed on child elements
   * @see https://eslint.vuejs.org/rules/no-v-for-template-key-on-child.html
   */
  'vue/no-v-for-template-key-on-child'?: Linter.RuleEntry<[]>
  /**
   * disallow use of v-html to prevent XSS attack
   * @see https://eslint.vuejs.org/rules/no-v-html.html
   */
  'vue/no-v-html'?: Linter.RuleEntry<VueNoVHtml>
  /**
   * disallow adding an argument to `v-model` used in custom component
   * @see https://eslint.vuejs.org/rules/no-v-model-argument.html
   * @deprecated
   */
  'vue/no-v-model-argument'?: Linter.RuleEntry<[]>
  /**
   * disallow use of v-text
   * @see https://eslint.vuejs.org/rules/no-v-text.html
   */
  'vue/no-v-text'?: Linter.RuleEntry<[]>
  /**
   * disallow v-text / v-html on component
   * @see https://eslint.vuejs.org/rules/no-v-text-v-html-on-component.html
   */
  'vue/no-v-text-v-html-on-component'?: Linter.RuleEntry<VueNoVTextVHtmlOnComponent>
  /**
   * disallow asynchronously registered `watch`
   * @see https://eslint.vuejs.org/rules/no-watch-after-await.html
   */
  'vue/no-watch-after-await'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent line breaks after opening and before closing braces in `<template>`
   * @see https://eslint.vuejs.org/rules/object-curly-newline.html
   */
  'vue/object-curly-newline'?: Linter.RuleEntry<VueObjectCurlyNewline>
  /**
   * Enforce consistent spacing inside braces in `<template>`
   * @see https://eslint.vuejs.org/rules/object-curly-spacing.html
   */
  'vue/object-curly-spacing'?: Linter.RuleEntry<VueObjectCurlySpacing>
  /**
   * Enforce placing object properties on separate lines in `<template>`
   * @see https://eslint.vuejs.org/rules/object-property-newline.html
   */
  'vue/object-property-newline'?: Linter.RuleEntry<VueObjectPropertyNewline>
  /**
   * Require or disallow method and property shorthand syntax for object literals in `<template>`
   * @see https://eslint.vuejs.org/rules/object-shorthand.html
   */
  'vue/object-shorthand'?: Linter.RuleEntry<VueObjectShorthand>
  /**
   * enforce that each component should be in its own file
   * @see https://eslint.vuejs.org/rules/one-component-per-file.html
   */
  'vue/one-component-per-file'?: Linter.RuleEntry<[]>
  /**
   * Enforce consistent linebreak style for operators in `<template>`
   * @see https://eslint.vuejs.org/rules/operator-linebreak.html
   */
  'vue/operator-linebreak'?: Linter.RuleEntry<VueOperatorLinebreak>
  /**
   * enforce order of properties in components
   * @see https://eslint.vuejs.org/rules/order-in-components.html
   */
  'vue/order-in-components'?: Linter.RuleEntry<VueOrderInComponents>
  /**
   * require or disallow padding lines between blocks
   * @see https://eslint.vuejs.org/rules/padding-line-between-blocks.html
   */
  'vue/padding-line-between-blocks'?: Linter.RuleEntry<VuePaddingLineBetweenBlocks>
  /**
   * require or disallow newlines between sibling tags in template
   * @see https://eslint.vuejs.org/rules/padding-line-between-tags.html
   */
  'vue/padding-line-between-tags'?: Linter.RuleEntry<VuePaddingLineBetweenTags>
  /**
   * require or disallow padding lines in component definition
   * @see https://eslint.vuejs.org/rules/padding-lines-in-component-definition.html
   */
  'vue/padding-lines-in-component-definition'?: Linter.RuleEntry<VuePaddingLinesInComponentDefinition>
  /**
   * enforce use of `defineOptions` instead of default export
   * @see https://eslint.vuejs.org/rules/prefer-define-options.html
   */
  'vue/prefer-define-options'?: Linter.RuleEntry<[]>
  /**
   * enforce import from 'vue' instead of import from '@vue/*'
   * @see https://eslint.vuejs.org/rules/prefer-import-from-vue.html
   */
  'vue/prefer-import-from-vue'?: Linter.RuleEntry<[]>
  /**
   * enforce `Boolean` comes first in component prop types
   * @see https://eslint.vuejs.org/rules/prefer-prop-type-boolean-first.html
   */
  'vue/prefer-prop-type-boolean-first'?: Linter.RuleEntry<[]>
  /**
   * require static class names in template to be in a separate `class` attribute
   * @see https://eslint.vuejs.org/rules/prefer-separate-static-class.html
   */
  'vue/prefer-separate-static-class'?: Linter.RuleEntry<[]>
  /**
   * enforce passing a single argument to custom event emissions
   * @see https://eslint.vuejs.org/rules/prefer-single-event-payload.html
   */
  'vue/prefer-single-event-payload'?: Linter.RuleEntry<[]>
  /**
   * Require template literals instead of string concatenation in `<template>`
   * @see https://eslint.vuejs.org/rules/prefer-template.html
   */
  'vue/prefer-template'?: Linter.RuleEntry<[]>
  /**
   * require shorthand form attribute when `v-bind` value is `true`
   * @see https://eslint.vuejs.org/rules/prefer-true-attribute-shorthand.html
   */
  'vue/prefer-true-attribute-shorthand'?: Linter.RuleEntry<VuePreferTrueAttributeShorthand>
  /**
   * require using `useTemplateRef` instead of `ref`/`shallowRef` for template refs
   * @see https://eslint.vuejs.org/rules/prefer-use-template-ref.html
   */
  'vue/prefer-use-template-ref'?: Linter.RuleEntry<[]>
  /**
   * enforce using `v-model` instead of `:prop`/`@update:prop` pair
   * @see https://eslint.vuejs.org/rules/prefer-v-model.html
   */
  'vue/prefer-v-model'?: Linter.RuleEntry<[]>
  /**
   * enforce specific casing for the Prop name in Vue components
   * @see https://eslint.vuejs.org/rules/prop-name-casing.html
   */
  'vue/prop-name-casing'?: Linter.RuleEntry<VuePropNameCasing>
  /**
   * Require quotes around object literal, type literal, interfaces and enums property names in `<template>`
   * @see https://eslint.vuejs.org/rules/quote-props.html
   */
  'vue/quote-props'?: Linter.RuleEntry<VueQuoteProps>
  /**
   * require `v-bind:is` of `<component>` elements
   * @see https://eslint.vuejs.org/rules/require-component-is.html
   */
  'vue/require-component-is'?: Linter.RuleEntry<[]>
  /**
   * require components to be the default export
   * @see https://eslint.vuejs.org/rules/require-default-export.html
   */
  'vue/require-default-export'?: Linter.RuleEntry<[]>
  /**
   * require default value for props
   * @see https://eslint.vuejs.org/rules/require-default-prop.html
   */
  'vue/require-default-prop'?: Linter.RuleEntry<[]>
  /**
   * require the component to be directly exported
   * @see https://eslint.vuejs.org/rules/require-direct-export.html
   */
  'vue/require-direct-export'?: Linter.RuleEntry<VueRequireDirectExport>
  /**
   * require type definitions in emits
   * @see https://eslint.vuejs.org/rules/require-emit-validator.html
   */
  'vue/require-emit-validator'?: Linter.RuleEntry<[]>
  /**
   * require `emits` option with name triggered by `$emit()`
   * @see https://eslint.vuejs.org/rules/require-explicit-emits.html
   */
  'vue/require-explicit-emits'?: Linter.RuleEntry<VueRequireExplicitEmits>
  /**
   * require slots to be explicitly defined
   * @see https://eslint.vuejs.org/rules/require-explicit-slots.html
   */
  'vue/require-explicit-slots'?: Linter.RuleEntry<[]>
  /**
   * require declare public properties using `expose`
   * @see https://eslint.vuejs.org/rules/require-expose.html
   */
  'vue/require-expose'?: Linter.RuleEntry<[]>
  /**
   * require a certain macro variable name
   * @see https://eslint.vuejs.org/rules/require-macro-variable-name.html
   */
  'vue/require-macro-variable-name'?: Linter.RuleEntry<VueRequireMacroVariableName>
  /**
   * require a name property in Vue components
   * @see https://eslint.vuejs.org/rules/require-name-property.html
   */
  'vue/require-name-property'?: Linter.RuleEntry<[]>
  /**
   * require props to have a comment
   * @see https://eslint.vuejs.org/rules/require-prop-comment.html
   */
  'vue/require-prop-comment'?: Linter.RuleEntry<VueRequirePropComment>
  /**
   * require prop type to be a constructor
   * @see https://eslint.vuejs.org/rules/require-prop-type-constructor.html
   */
  'vue/require-prop-type-constructor'?: Linter.RuleEntry<[]>
  /**
   * require type definitions in props
   * @see https://eslint.vuejs.org/rules/require-prop-types.html
   */
  'vue/require-prop-types'?: Linter.RuleEntry<[]>
  /**
   * enforce render function to always return value
   * @see https://eslint.vuejs.org/rules/require-render-return.html
   */
  'vue/require-render-return'?: Linter.RuleEntry<[]>
  /**
   * enforce properties of `$slots` to be used as a function
   * @see https://eslint.vuejs.org/rules/require-slots-as-functions.html
   */
  'vue/require-slots-as-functions'?: Linter.RuleEntry<[]>
  /**
   * require control the display of the content inside `<transition>`
   * @see https://eslint.vuejs.org/rules/require-toggle-inside-transition.html
   */
  'vue/require-toggle-inside-transition'?: Linter.RuleEntry<VueRequireToggleInsideTransition>
  /**
   * enforce adding type declarations to object props
   * @see https://eslint.vuejs.org/rules/require-typed-object-prop.html
   */
  'vue/require-typed-object-prop'?: Linter.RuleEntry<[]>
  /**
   * require `ref` and `shallowRef` functions to be strongly typed
   * @see https://eslint.vuejs.org/rules/require-typed-ref.html
   */
  'vue/require-typed-ref'?: Linter.RuleEntry<[]>
  /**
   * require `v-bind:key` with `v-for` directives
   * @see https://eslint.vuejs.org/rules/require-v-for-key.html
   */
  'vue/require-v-for-key'?: Linter.RuleEntry<[]>
  /**
   * enforce props default values to be valid
   * @see https://eslint.vuejs.org/rules/require-valid-default-prop.html
   */
  'vue/require-valid-default-prop'?: Linter.RuleEntry<[]>
  /**
   * enforce using only specific component names
   * @see https://eslint.vuejs.org/rules/restricted-component-names.html
   */
  'vue/restricted-component-names'?: Linter.RuleEntry<VueRestrictedComponentNames>
  /**
   * enforce that a return statement is present in computed property
   * @see https://eslint.vuejs.org/rules/return-in-computed-property.html
   */
  'vue/return-in-computed-property'?: Linter.RuleEntry<VueReturnInComputedProperty>
  /**
   * enforce that a return statement is present in emits validator
   * @see https://eslint.vuejs.org/rules/return-in-emits-validator.html
   */
  'vue/return-in-emits-validator'?: Linter.RuleEntry<[]>
  /**
   * enforce consistent indentation in `<script>`
   * @see https://eslint.vuejs.org/rules/script-indent.html
   */
  'vue/script-indent'?: Linter.RuleEntry<VueScriptIndent>
  /**
   * require a line break before and after the contents of a singleline element
   * @see https://eslint.vuejs.org/rules/singleline-html-element-content-newline.html
   */
  'vue/singleline-html-element-content-newline'?: Linter.RuleEntry<VueSinglelineHtmlElementContentNewline>
  /**
   * enforce specific casing for slot names
   * @see https://eslint.vuejs.org/rules/slot-name-casing.html
   */
  'vue/slot-name-casing'?: Linter.RuleEntry<VueSlotNameCasing>
  /**
   * enforce sort-keys in a manner that is compatible with order-in-components
   * @see https://eslint.vuejs.org/rules/sort-keys.html
   */
  'vue/sort-keys'?: Linter.RuleEntry<VueSortKeys>
  /**
   * Enforce consistent spacing inside parentheses in `<template>`
   * @see https://eslint.vuejs.org/rules/space-in-parens.html
   */
  'vue/space-in-parens'?: Linter.RuleEntry<VueSpaceInParens>
  /**
   * Require spacing around infix operators in `<template>`
   * @see https://eslint.vuejs.org/rules/space-infix-ops.html
   */
  'vue/space-infix-ops'?: Linter.RuleEntry<VueSpaceInfixOps>
  /**
   * Enforce consistent spacing before or after unary operators in `<template>`
   * @see https://eslint.vuejs.org/rules/space-unary-ops.html
   */
  'vue/space-unary-ops'?: Linter.RuleEntry<VueSpaceUnaryOps>
  /**
   * enforce static class names order
   * @see https://eslint.vuejs.org/rules/static-class-names-order.html
   */
  'vue/static-class-names-order'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing around embedded expressions of template strings in `<template>`
   * @see https://eslint.vuejs.org/rules/template-curly-spacing.html
   */
  'vue/template-curly-spacing'?: Linter.RuleEntry<VueTemplateCurlySpacing>
  /**
   * disallow usage of `this` in template
   * @see https://eslint.vuejs.org/rules/this-in-template.html
   */
  'vue/this-in-template'?: Linter.RuleEntry<VueThisInTemplate>
  /**
   * enforce usage of `exact` modifier on `v-on`
   * @see https://eslint.vuejs.org/rules/use-v-on-exact.html
   */
  'vue/use-v-on-exact'?: Linter.RuleEntry<[]>
  /**
   * enforce `v-bind` directive style
   * @see https://eslint.vuejs.org/rules/v-bind-style.html
   */
  'vue/v-bind-style'?: Linter.RuleEntry<VueVBindStyle>
  /**
   * enforce `v-for` directive's delimiter style
   * @see https://eslint.vuejs.org/rules/v-for-delimiter-style.html
   */
  'vue/v-for-delimiter-style'?: Linter.RuleEntry<VueVForDelimiterStyle>
  /**
   * require key attribute for conditionally rendered repeated components
   * @see https://eslint.vuejs.org/rules/v-if-else-key.html
   */
  'vue/v-if-else-key'?: Linter.RuleEntry<[]>
  /**
   * enforce v-on event naming style on custom components in template
   * @see https://eslint.vuejs.org/rules/v-on-event-hyphenation.html
   */
  'vue/v-on-event-hyphenation'?: Linter.RuleEntry<VueVOnEventHyphenation>
  /**
   * enforce writing style for handlers in `v-on` directives
   * @see https://eslint.vuejs.org/rules/v-on-handler-style.html
   */
  'vue/v-on-handler-style'?: Linter.RuleEntry<VueVOnHandlerStyle>
  /**
   * enforce `v-on` directive style
   * @see https://eslint.vuejs.org/rules/v-on-style.html
   */
  'vue/v-on-style'?: Linter.RuleEntry<VueVOnStyle>
  /**
   * enforce `v-slot` directive style
   * @see https://eslint.vuejs.org/rules/v-slot-style.html
   */
  'vue/v-slot-style'?: Linter.RuleEntry<VueVSlotStyle>
  /**
   * require valid attribute names
   * @see https://eslint.vuejs.org/rules/valid-attribute-name.html
   */
  'vue/valid-attribute-name'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `defineEmits` compiler macro
   * @see https://eslint.vuejs.org/rules/valid-define-emits.html
   */
  'vue/valid-define-emits'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `defineOptions` compiler macro
   * @see https://eslint.vuejs.org/rules/valid-define-options.html
   */
  'vue/valid-define-options'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `defineProps` compiler macro
   * @see https://eslint.vuejs.org/rules/valid-define-props.html
   */
  'vue/valid-define-props'?: Linter.RuleEntry<[]>
  /**
   * require valid keys in model option
   * @see https://eslint.vuejs.org/rules/valid-model-definition.html
   * @deprecated
   */
  'vue/valid-model-definition'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `nextTick` function calls
   * @see https://eslint.vuejs.org/rules/valid-next-tick.html
   */
  'vue/valid-next-tick'?: Linter.RuleEntry<[]>
  /**
   * enforce valid template root
   * @see https://eslint.vuejs.org/rules/valid-template-root.html
   */
  'vue/valid-template-root'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-bind` directives
   * @see https://eslint.vuejs.org/rules/valid-v-bind.html
   */
  'vue/valid-v-bind'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `.sync` modifier on `v-bind` directives
   * @see https://eslint.vuejs.org/rules/valid-v-bind-sync.html
   * @deprecated
   */
  'vue/valid-v-bind-sync'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-cloak` directives
   * @see https://eslint.vuejs.org/rules/valid-v-cloak.html
   */
  'vue/valid-v-cloak'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-else` directives
   * @see https://eslint.vuejs.org/rules/valid-v-else.html
   */
  'vue/valid-v-else'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-else-if` directives
   * @see https://eslint.vuejs.org/rules/valid-v-else-if.html
   */
  'vue/valid-v-else-if'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-for` directives
   * @see https://eslint.vuejs.org/rules/valid-v-for.html
   */
  'vue/valid-v-for'?: Linter.RuleEntry<VueValidVFor>
  /**
   * enforce valid `v-html` directives
   * @see https://eslint.vuejs.org/rules/valid-v-html.html
   */
  'vue/valid-v-html'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-if` directives
   * @see https://eslint.vuejs.org/rules/valid-v-if.html
   */
  'vue/valid-v-if'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-is` directives
   * @see https://eslint.vuejs.org/rules/valid-v-is.html
   */
  'vue/valid-v-is'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-memo` directives
   * @see https://eslint.vuejs.org/rules/valid-v-memo.html
   */
  'vue/valid-v-memo'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-model` directives
   * @see https://eslint.vuejs.org/rules/valid-v-model.html
   */
  'vue/valid-v-model'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-on` directives
   * @see https://eslint.vuejs.org/rules/valid-v-on.html
   */
  'vue/valid-v-on'?: Linter.RuleEntry<VueValidVOn>
  /**
   * enforce valid `v-once` directives
   * @see https://eslint.vuejs.org/rules/valid-v-once.html
   */
  'vue/valid-v-once'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-pre` directives
   * @see https://eslint.vuejs.org/rules/valid-v-pre.html
   */
  'vue/valid-v-pre'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-show` directives
   * @see https://eslint.vuejs.org/rules/valid-v-show.html
   */
  'vue/valid-v-show'?: Linter.RuleEntry<[]>
  /**
   * enforce valid `v-slot` directives
   * @see https://eslint.vuejs.org/rules/valid-v-slot.html
   */
  'vue/valid-v-slot'?: Linter.RuleEntry<VueValidVSlot>
  /**
   * enforce valid `v-text` directives
   * @see https://eslint.vuejs.org/rules/valid-v-text.html
   */
  'vue/valid-v-text'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/alt-text.html
   */
  'vuejs-accessibility/alt-text'?: Linter.RuleEntry<VuejsAccessibilityAltText>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/anchor-has-content.html
   */
  'vuejs-accessibility/anchor-has-content'?: Linter.RuleEntry<VuejsAccessibilityAnchorHasContent>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/aria-props.html
   */
  'vuejs-accessibility/aria-props'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/aria-role.html
   */
  'vuejs-accessibility/aria-role'?: Linter.RuleEntry<VuejsAccessibilityAriaRole>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/aria-unsupported-elements.html
   */
  'vuejs-accessibility/aria-unsupported-elements'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/click-events-have-key-events.html
   */
  'vuejs-accessibility/click-events-have-key-events'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/form-control-has-label.html
   */
  'vuejs-accessibility/form-control-has-label'?: Linter.RuleEntry<VuejsAccessibilityFormControlHasLabel>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/heading-has-content.html
   */
  'vuejs-accessibility/heading-has-content'?: Linter.RuleEntry<VuejsAccessibilityHeadingHasContent>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/iframe-has-title.html
   */
  'vuejs-accessibility/iframe-has-title'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/interactive-supports-focus.html
   */
  'vuejs-accessibility/interactive-supports-focus'?: Linter.RuleEntry<VuejsAccessibilityInteractiveSupportsFocus>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/label-has-for.html
   */
  'vuejs-accessibility/label-has-for'?: Linter.RuleEntry<VuejsAccessibilityLabelHasFor>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/media-has-caption.html
   */
  'vuejs-accessibility/media-has-caption'?: Linter.RuleEntry<VuejsAccessibilityMediaHasCaption>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/mouse-events-have-key-events.html
   */
  'vuejs-accessibility/mouse-events-have-key-events'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/no-access-key.html
   */
  'vuejs-accessibility/no-access-key'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/no-aria-hidden-on-focusable.html
   */
  'vuejs-accessibility/no-aria-hidden-on-focusable'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/no-autofocus.html
   */
  'vuejs-accessibility/no-autofocus'?: Linter.RuleEntry<VuejsAccessibilityNoAutofocus>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/no-distracting-elements.html
   */
  'vuejs-accessibility/no-distracting-elements'?: Linter.RuleEntry<VuejsAccessibilityNoDistractingElements>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/no-onchange.html
   * @deprecated
   */
  'vuejs-accessibility/no-onchange'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/no-redundant-roles.html
   */
  'vuejs-accessibility/no-redundant-roles'?: Linter.RuleEntry<VuejsAccessibilityNoRedundantRoles>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/no-role-presentation-on-focusable.html
   */
  'vuejs-accessibility/no-role-presentation-on-focusable'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/no-static-element-interactions.html
   */
  'vuejs-accessibility/no-static-element-interactions'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/role-has-required-aria-props.html
   */
  'vuejs-accessibility/role-has-required-aria-props'?: Linter.RuleEntry<[]>
  /**
   * @see https://vue-a11y.github.io/eslint-plugin-vuejs-accessibility/rules/tabindex-no-positive.html
   */
  'vuejs-accessibility/tabindex-no-positive'?: Linter.RuleEntry<[]>
  /**
   * Require parentheses around immediate `function` invocations
   * @see https://eslint.org/docs/latest/rules/wrap-iife
   * @deprecated
   */
  'wrap-iife'?: Linter.RuleEntry<WrapIife>
  /**
   * Require parenthesis around regex literals
   * @see https://eslint.org/docs/latest/rules/wrap-regex
   * @deprecated
   */
  'wrap-regex'?: Linter.RuleEntry<[]>
  /**
   * Require or disallow spacing around the `*` in `yield*` expressions
   * @see https://eslint.org/docs/latest/rules/yield-star-spacing
   * @deprecated
   */
  'yield-star-spacing'?: Linter.RuleEntry<YieldStarSpacing>
  /**
   * Require or disallow "Yoda" conditions
   * @see https://eslint.org/docs/latest/rules/yoda
   */
  'yoda'?: Linter.RuleEntry<Yoda>
}

/* ======= Declarations ======= */
// ----- @angular-eslint/component-class-suffix -----
type AngularEslintComponentClassSuffix = []|[{
  suffixes?: string[]
}]
// ----- @angular-eslint/component-max-inline-declarations -----
type AngularEslintComponentMaxInlineDeclarations = []|[{
  template?: number
  styles?: number
  animations?: number
}]
// ----- @angular-eslint/component-selector -----
type AngularEslintComponentSelector = []|[({
  type: (string | ("element" | "attribute")[])
  prefix?: (string | unknown[])
  style: ("camelCase" | "kebab-case")
} | [{
  type: ("element" | "attribute")
  prefix?: (string | unknown[])
  style: ("camelCase" | "kebab-case")
}]|[{
  type: ("element" | "attribute")
  prefix?: (string | unknown[])
  style: ("camelCase" | "kebab-case")
}, {
  type: ("element" | "attribute")
  prefix?: (string | unknown[])
  style: ("camelCase" | "kebab-case")
}])]
// ----- @angular-eslint/consistent-component-styles -----
type AngularEslintConsistentComponentStyles = []|[("array" | "string")]
// ----- @angular-eslint/directive-class-suffix -----
type AngularEslintDirectiveClassSuffix = []|[{
  suffixes?: string[]
}]
// ----- @angular-eslint/directive-selector -----
type AngularEslintDirectiveSelector = []|[({
  type: (string | ("element" | "attribute")[])
  prefix?: (string | unknown[])
  style: ("camelCase" | "kebab-case")
} | [{
  type: ("element" | "attribute")
  prefix?: (string | unknown[])
  style: ("camelCase" | "kebab-case")
}]|[{
  type: ("element" | "attribute")
  prefix?: (string | unknown[])
  style: ("camelCase" | "kebab-case")
}, {
  type: ("element" | "attribute")
  prefix?: (string | unknown[])
  style: ("camelCase" | "kebab-case")
}])]
// ----- @angular-eslint/inject-at-top -----
type AngularEslintInjectAtTop = []|[{
  
  additionalInjectFunctions?: string[]
}]
// ----- @angular-eslint/no-input-prefix -----
type AngularEslintNoInputPrefix = []|[{
  prefixes?: string[]
}]
// ----- @angular-eslint/no-input-rename -----
type AngularEslintNoInputRename = []|[{
  
  allowedNames?: string[]
}]
// ----- @angular-eslint/pipe-prefix -----
type AngularEslintPipePrefix = []|[{
  prefixes?: string[]
}]
// ----- @angular-eslint/prefer-on-push-component-change-detection -----
type AngularEslintPreferOnPushComponentChangeDetection = []|[{
  
  allowExplicitOnPush?: boolean
}]
// ----- @angular-eslint/prefer-signal-model -----
type AngularEslintPreferSignalModel = []|[{
  useTypeChecking?: boolean
}]
// ----- @angular-eslint/prefer-signals -----
type AngularEslintPreferSignals = []|[{
  preferReadonlySignalProperties?: boolean
  preferInputSignals?: boolean
  preferQuerySignals?: boolean
  useTypeChecking?: boolean
  additionalSignalCreationFunctions?: string[]
}]
// ----- @angular-eslint/reactive-context-must-read-signal -----
type AngularEslintReactiveContextMustReadSignal = []|[{
  
  checkResources?: boolean
}]
// ----- @angular-eslint/require-localize-metadata -----
type AngularEslintRequireLocalizeMetadata = []|[{
  requireDescription?: boolean
  requireMeaning?: boolean
  requireCustomId?: (boolean | string)
}]
// ----- @angular-eslint/sort-keys-in-type-decorator -----
type AngularEslintSortKeysInTypeDecorator = []|[{
  Component?: string[]
  Directive?: string[]
  Injectable?: string[]
  NgModule?: string[]
  Pipe?: string[]
  allowUnconfiguredProperties?: boolean
}]
// ----- @angular-eslint/template/attributes-order -----
type AngularEslintTemplateAttributesOrder = []|[{
  alphabetical?: boolean
  
  order?: [("STRUCTURAL_DIRECTIVE" | "TEMPLATE_REFERENCE" | "ATTRIBUTE_BINDING" | "INPUT_BINDING" | "TWO_WAY_BINDING" | "OUTPUT_BINDING"), ("STRUCTURAL_DIRECTIVE" | "TEMPLATE_REFERENCE" | "ATTRIBUTE_BINDING" | "INPUT_BINDING" | "TWO_WAY_BINDING" | "OUTPUT_BINDING"), ("STRUCTURAL_DIRECTIVE" | "TEMPLATE_REFERENCE" | "ATTRIBUTE_BINDING" | "INPUT_BINDING" | "TWO_WAY_BINDING" | "OUTPUT_BINDING"), ("STRUCTURAL_DIRECTIVE" | "TEMPLATE_REFERENCE" | "ATTRIBUTE_BINDING" | "INPUT_BINDING" | "TWO_WAY_BINDING" | "OUTPUT_BINDING"), ("STRUCTURAL_DIRECTIVE" | "TEMPLATE_REFERENCE" | "ATTRIBUTE_BINDING" | "INPUT_BINDING" | "TWO_WAY_BINDING" | "OUTPUT_BINDING"), ("STRUCTURAL_DIRECTIVE" | "TEMPLATE_REFERENCE" | "ATTRIBUTE_BINDING" | "INPUT_BINDING" | "TWO_WAY_BINDING" | "OUTPUT_BINDING"), ...(("STRUCTURAL_DIRECTIVE" | "TEMPLATE_REFERENCE" | "ATTRIBUTE_BINDING" | "INPUT_BINDING" | "TWO_WAY_BINDING" | "OUTPUT_BINDING"))[]]
}]
// ----- @angular-eslint/template/button-has-type -----
type AngularEslintTemplateButtonHasType = []|[{
  
  ignoreWithDirectives?: string[]
}]
// ----- @angular-eslint/template/click-events-have-key-events -----
type AngularEslintTemplateClickEventsHaveKeyEvents = []|[{
  
  ignoreWithDirectives?: string[]
  
  requireKeyCode?: boolean
  
  allowedKeyCodes?: string[]
}]
// ----- @angular-eslint/template/conditional-complexity -----
type AngularEslintTemplateConditionalComplexity = []|[{
  maxComplexity?: number
}]
// ----- @angular-eslint/template/cyclomatic-complexity -----
type AngularEslintTemplateCyclomaticComplexity = []|[{
  maxComplexity?: number
  variant?: ("classic" | "modified")
}]
// ----- @angular-eslint/template/elements-content -----
type AngularEslintTemplateElementsContent = []|[{
  allowList?: string[]
}]
// ----- @angular-eslint/template/eqeqeq -----
type AngularEslintTemplateEqeqeq = []|[{
  allowNullOrUndefined?: boolean
}]
// ----- @angular-eslint/template/i18n -----
type AngularEslintTemplateI18N = []|[{
  allowMarkupInContent?: boolean
  boundTextAllowedPattern?: string
  checkAttributes?: boolean
  checkDuplicateId?: boolean
  checkId?: boolean
  checkText?: boolean
  ignoreAttributes?: string[]
  ignoreTags?: string[]
  requireDescription?: boolean
  requireMeaning?: boolean
}]
// ----- @angular-eslint/template/interactive-supports-focus -----
type AngularEslintTemplateInteractiveSupportsFocus = []|[{
  allowList?: string[]
}]
// ----- @angular-eslint/template/label-has-associated-control -----
type AngularEslintTemplateLabelHasAssociatedControl = []|[{
  checkIds?: boolean
  controlComponents?: string[]
  labelComponents?: {
    inputs?: string[]
    selector: string
  }[]
}]
// ----- @angular-eslint/template/no-call-expression -----
type AngularEslintTemplateNoCallExpression = []|[{
  allowList?: string[]
  allowPrefix?: string
  allowSuffix?: string
}]
// ----- @angular-eslint/template/no-duplicate-attributes -----
type AngularEslintTemplateNoDuplicateAttributes = []|[{
  
  allowTwoWayDataBinding?: boolean
  
  allowStylePrecedenceDuplicates?: boolean
  
  ignore?: string[]
}]
// ----- @angular-eslint/template/no-inline-styles -----
type AngularEslintTemplateNoInlineStyles = []|[{
  
  allowNgStyle?: (boolean | "dynamic")
  
  allowBindToStyle?: (boolean | "dynamic")
}]
// ----- @angular-eslint/template/no-interpolation-in-attributes -----
type AngularEslintTemplateNoInterpolationInAttributes = []|[{
  
  allowSubstringInterpolation?: boolean
}]
// ----- @angular-eslint/template/prefer-built-in-pipes -----
type AngularEslintTemplatePreferBuiltInPipes = []|[{
  
  disallowList?: string[]
  
  allowInOutputHandlers?: boolean
}]
// ----- @angular-eslint/template/prefer-contextual-for-variables -----
type AngularEslintTemplatePreferContextualForVariables = []|[{
  allowedAliases?: {
    
    $count?: string[]
    
    $index?: string[]
    
    $first?: string[]
    
    $last?: string[]
    
    $even?: string[]
    
    $odd?: string[]
  }
}]
// ----- @angular-eslint/template/prefer-static-string-properties -----
type AngularEslintTemplatePreferStaticStringProperties = []|[{
  
  ignore?: string[]
}]
// ----- @angular-eslint/template/use-track-by-function -----
type AngularEslintTemplateUseTrackByFunction = []|[{
  alias?: string[]
}]
// ----- @angular-eslint/use-injectable-provided-in -----
type AngularEslintUseInjectableProvidedIn = []|[{
  ignoreClassNamePattern?: string
  allowProvidedInNull?: boolean
}]
// ----- @eslint-react/dom-no-unknown-property -----
type EslintReactDomNoUnknownProperty = []|[{
  
  ignore?: string[]
  
  requireDataLowercase?: boolean
}]
// ----- @eslint-react/exhaustive-deps -----
type EslintReactExhaustiveDeps = []|[{
  additionalHooks?: string
  enableDangerousAutofixThisMayCauseInfiniteLoops?: boolean
  experimental_autoDependenciesHooks?: string[]
  requireExplicitEffectDeps?: boolean
}]
// ----- @eslint-react/jsx-no-useless-fragment -----
type EslintReactJsxNoUselessFragment = []|[{
  
  allowEmptyFragment?: boolean
  
  allowExpressions?: boolean
}]
// ----- @eslint-react/no-unstable-default-props -----
type EslintReactNoUnstableDefaultProps = []|[{
  safeDefaultProps?: string[]
}]
// ----- @eslint-react/rules-of-hooks -----
type EslintReactRulesOfHooks = []|[{
  additionalHooks?: string
}]
// ----- @eslint-react/use-state -----
type EslintReactUseState = []|[{
  enforceAssignment?: boolean
  enforceLazyInitialization?: boolean
  enforceSetterName?: boolean
}]
// ----- @eslint-react/x-exhaustive-deps -----
type EslintReactXExhaustiveDeps = []|[{
  additionalHooks?: string
  enableDangerousAutofixThisMayCauseInfiniteLoops?: boolean
  experimental_autoDependenciesHooks?: string[]
  requireExplicitEffectDeps?: boolean
}]
// ----- @eslint-react/x-no-unstable-default-props -----
type EslintReactXNoUnstableDefaultProps = []|[{
  safeDefaultProps?: string[]
}]
// ----- @eslint-react/x-rules-of-hooks -----
type EslintReactXRulesOfHooks = []|[{
  additionalHooks?: string
}]
// ----- @eslint-react/x-use-state -----
type EslintReactXUseState = []|[{
  enforceAssignment?: boolean
  enforceLazyInitialization?: boolean
  enforceSetterName?: boolean
}]
// ----- @html-eslint/attrs-newline -----
type HtmlEslintAttrsNewline = []|[{
  closeStyle?: ("newline" | "sameline")
  ifAttrsMoreThan?: number
  maxLen?: number
  skip?: string[]
  inline?: string[]
}]
// ----- @html-eslint/element-newline -----
type HtmlEslintElementNewline = []|[{
  inline?: string[]
  skip?: string[]
}]
// ----- @html-eslint/head-order -----
type HtmlEslintHeadOrder = []|[{
  ignores?: {
    tagPattern?: string
    attrKeyPattern?: string
    attrValuePattern?: string
  }[]
}]
// ----- @html-eslint/id-naming-convention -----
type HtmlEslintIdNamingConvention = []|[("camelCase" | "snake_case" | "PascalCase" | "kebab-case" | "regex")]|[("camelCase" | "snake_case" | "PascalCase" | "kebab-case" | "regex"), {
  pattern?: string
  flags?: string
}]
// ----- @html-eslint/indent -----
type HtmlEslintIndent = []|[("tab" | number)]|[("tab" | number), {
  Attribute?: number
  tagChildrenIndent?: {
    [k: string]: number
  }
  ignoreComment?: boolean
  templateIndentBase?: ("first" | "templateTag")
}]
// ----- @html-eslint/max-element-depth -----
type HtmlEslintMaxElementDepth = []|[{
  max: number
}]
// ----- @html-eslint/no-extra-spacing-attrs -----
type HtmlEslintNoExtraSpacingAttrs = []|[{
  disallowInAssignment?: boolean
  disallowMissing?: boolean
  disallowTabs?: boolean
  enforceBeforeSelfClose?: boolean
}]
// ----- @html-eslint/no-extra-spacing-tags -----
type HtmlEslintNoExtraSpacingTags = []|[{
  disallowInAssignment?: boolean
  disallowMissing?: boolean
  disallowTabs?: boolean
  enforceBeforeSelfClose?: boolean
}]
// ----- @html-eslint/no-extra-spacing-text -----
type HtmlEslintNoExtraSpacingText = []|[{
  skip?: string[]
}]
// ----- @html-eslint/no-inline-styles -----
type HtmlEslintNoInlineStyles = []|[{
  allowExpressions?: boolean
}]
// ----- @html-eslint/no-invalid-attr-value -----
type HtmlEslintNoInvalidAttrValue = []|[{
  allow?: {
    tag: string
    attr: string
    valuePattern?: string
  }[]
}]
// ----- @html-eslint/no-multiple-empty-lines -----
type HtmlEslintNoMultipleEmptyLines = []|[{
  max: number
}]
// ----- @html-eslint/no-restricted-attr-values -----
type HtmlEslintNoRestrictedAttrValues = {
  attrPatterns: string[]
  attrValuePatterns: string[]
  message?: string
}[]
// ----- @html-eslint/no-restricted-attrs -----
type HtmlEslintNoRestrictedAttrs = {
  tagPatterns: string[]
  attrPatterns: string[]
  message?: string
}[]
// ----- @html-eslint/no-restricted-tags -----
type HtmlEslintNoRestrictedTags = {
  tagPatterns: string[]
  message?: string
}[]
// ----- @html-eslint/no-whitespace-only-children -----
type HtmlEslintNoWhitespaceOnlyChildren = []|[{
  tagPatterns?: string[]
}]
// ----- @html-eslint/quotes -----
type HtmlEslintQuotes = []|[("single" | "double")]|[("single" | "double"), {
  enforceTemplatedAttrValue?: boolean
}]
// ----- @html-eslint/require-attrs -----
type HtmlEslintRequireAttrs = {
  tag: string
  attr: string
  value?: string
  message?: string
  conditions?: {
    attr: string
    value?: string
    kind: ("present" | "absent" | "equal" | "not-equal")
  }[]
}[]
// ----- @html-eslint/require-closing-tags -----
type HtmlEslintRequireClosingTags = []|[{
  selfClosing?: ("always" | "never")
  selfClosingCustomPatterns?: string[]
}]
// ----- @html-eslint/require-explicit-size -----
type HtmlEslintRequireExplicitSize = []|[{
  allowClass?: string[]
  allowId?: string[]
}]
// ----- @html-eslint/require-img-alt -----
type HtmlEslintRequireImgAlt = []|[{
  substitute?: string[]
}]
// ----- @html-eslint/require-open-graph-protocol -----
type HtmlEslintRequireOpenGraphProtocol = []|[string[]]
// ----- @html-eslint/sort-attrs -----
type HtmlEslintSortAttrs = []|[{
  priority?: (string | {
    pattern: string
    order?: ("preserve" | "alphabetically")
  })[]
}]
// ----- @html-eslint/use-baseline -----
type HtmlEslintUseBaseline = []|[{
  available?: (("widely" | "newly") | number)
}]
// ----- @linteljs/chain-call-newline -----
type LinteljsChainCallNewline = []|[{
  maxLineLength?: number
}]
// ----- @linteljs/interface-order -----
type LinteljsInterfaceOrder = []|[{
  trimBlankLines?: boolean
}]
// ----- @linteljs/member-newline -----
type LinteljsMemberNewline = []|[{
  maxProperties?: number
}]
// ----- @linteljs/name-before-use -----
type LinteljsNameBeforeUse = []|[{
  ignoreEmptyLiterals?: boolean
  ignoreLiteralArguments?: boolean
}]
// ----- @linteljs/native-accessible-name -----
type LinteljsNativeAccessibleName = []|[{
  components?: string[]
}]
// ----- @linteljs/native-no-nested-touchables -----
type LinteljsNativeNoNestedTouchables = []|[{
  components?: string[]
}]
// ----- @linteljs/no-eslint-disable -----
type LinteljsNoEslintDisable = []|[{
  allowRules?: string[]
}]
// ----- @linteljs/no-inline-object-types -----
type LinteljsNoInlineObjectTypes = []|[{
  allowIn?: string[]
}]
// ----- @linteljs/prefer-alias -----
type LinteljsPreferAlias = []|[{
  aliasExempt?: string[]
  enforceRelativeImports?: boolean
}]
// ----- @linteljs/prefer-arrow-functions -----
type LinteljsPreferArrowFunctions = []|[{
  forceHoisted?: boolean
}]
// ----- @linteljs/prefer-async-await -----
type LinteljsPreferAsyncAwait = []|[{
  strict?: boolean
}]
// ----- @linteljs/sort-hook-dependencies -----
type LinteljsSortHookDependencies = []|[{
  order?: ("asc" | "desc")
  
  hooks?: [string, ...(string)[]]
}]
// ----- @linteljs/specifier-newline -----
type LinteljsSpecifierNewline = []|[{
  maxItems?: number
}]
// ----- @linteljs/union-newline -----
type LinteljsUnionNewline = []|[{
  maxGenericMembers?: number
}]
// ----- @next/next/no-html-link-for-pages -----
type NextNextNoHtmlLinkForPages = []|[(string | string[])]
// ----- @stylexjs/enforce-extension -----
type StylexjsEnforceExtension = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
  themeFileExtension?: string
  legacyAllowMixedExports?: boolean
  enforceDefineConstsExtension?: boolean
}]
// ----- @stylexjs/no-conflicting-props -----
type StylexjsNoConflictingProps = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
}]
// ----- @stylexjs/no-legacy-contextual-styles -----
type StylexjsNoLegacyContextualStyles = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
}]
// ----- @stylexjs/no-lookahead-selectors -----
type StylexjsNoLookaheadSelectors = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
}]
// ----- @stylexjs/no-nonstandard-styles -----
type StylexjsNoNonstandardStyles = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
  [k: string]: unknown | undefined
}]
// ----- @stylexjs/no-unused -----
type StylexjsNoUnused = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
}]
// ----- @stylexjs/sort-keys -----
type StylexjsSortKeys = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
  order?: ("default" | "clean" | "recess")
  minKeys?: number
  allowLineSeparatedGroups?: boolean
  enableMediaQueryOrder?: boolean
}]
// ----- @stylexjs/valid-shorthands -----
type StylexjsValidShorthands = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
  allowImportant?: boolean
  preferInline?: boolean
}]
// ----- @stylexjs/valid-styles -----
type StylexjsValidStyles = []|[{
  validImports?: (string | {
    from?: string
    as?: string
    [k: string]: unknown | undefined
  })[]
  allowRawCSSVars?: boolean
  allowOuterPseudoAndMedia?: boolean
  banPropsForLegacy?: boolean
  styleResolution?: ("application-order" | "property-specificity" | "legacy-expand-shorthands")
  propLimits?: {
    [k: string]: {
      limit?: (null | string | number | (null | string | number)[])
      reason?: string
      [k: string]: unknown | undefined
    } | undefined
  }
  [k: string]: unknown | undefined
}]
// ----- @stylistic/array-bracket-newline -----
type StylisticArrayBracketNewline = []|[(("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})]
// ----- @stylistic/array-bracket-spacing -----
type StylisticArrayBracketSpacing = []|[("always" | "never")]|[("always" | "never"), {
  singleValue?: boolean
  objectsInArrays?: boolean
  arraysInArrays?: boolean
}]
// ----- @stylistic/array-element-newline -----
type StylisticArrayElementNewline = []|[(_StylisticArrayElementNewlineBasicConfig | {
  ArrayExpression?: _StylisticArrayElementNewlineBasicConfig
  ArrayPattern?: _StylisticArrayElementNewlineBasicConfig
})]
type _StylisticArrayElementNewlineBasicConfig = (("always" | "never" | "consistent") | {
  consistent?: boolean
  multiline?: boolean
  minItems?: (number | null)
})
// ----- @stylistic/arrow-parens -----
type StylisticArrowParens = []|[("always" | "as-needed")]|[("always" | "as-needed"), {
  requireForBlockBody?: boolean
}]
// ----- @stylistic/arrow-spacing -----
type StylisticArrowSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- @stylistic/block-spacing -----
type StylisticBlockSpacing = []|[("always" | "never")]
// ----- @stylistic/brace-style -----
type StylisticBraceStyle = []|[("1tbs" | "stroustrup" | "allman")]|[("1tbs" | "stroustrup" | "allman"), {
  allowSingleLine?: boolean
}]
// ----- @stylistic/comma-dangle -----
type StylisticCommaDangle = []|[(_StylisticCommaDangleValue | {
  arrays?: _StylisticCommaDangleValueWithIgnore
  objects?: _StylisticCommaDangleValueWithIgnore
  imports?: _StylisticCommaDangleValueWithIgnore
  exports?: _StylisticCommaDangleValueWithIgnore
  functions?: _StylisticCommaDangleValueWithIgnore
  importAttributes?: _StylisticCommaDangleValueWithIgnore
  dynamicImports?: _StylisticCommaDangleValueWithIgnore
  enums?: _StylisticCommaDangleValueWithIgnore
  generics?: _StylisticCommaDangleValueWithIgnore
  tuples?: _StylisticCommaDangleValueWithIgnore
})]
type _StylisticCommaDangleValue = ("always-multiline" | "always" | "never" | "only-multiline")
type _StylisticCommaDangleValueWithIgnore = ("always-multiline" | "always" | "never" | "only-multiline" | "ignore")
// ----- @stylistic/comma-spacing -----
type StylisticCommaSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- @stylistic/comma-style -----
type StylisticCommaStyle = []|[("first" | "last")]|[("first" | "last"), {
  exceptions?: {
    [k: string]: boolean | undefined
  }
}]
// ----- @stylistic/computed-property-spacing -----
type StylisticComputedPropertySpacing = []|[("always" | "never")]|[("always" | "never"), {
  enforceForClassMembers?: boolean
}]
// ----- @stylistic/curly-newline -----
type StylisticCurlyNewline = []|[(("always" | "never") | {
  IfStatementConsequent?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  IfStatementAlternative?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  DoWhileStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ForInStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ForOfStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ForStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  WhileStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  SwitchStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  SwitchCase?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  TryStatementBlock?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  TryStatementHandler?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  TryStatementFinalizer?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  BlockStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ArrowFunctionExpression?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  FunctionDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  FunctionExpression?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  Property?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  ClassBody?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  StaticBlock?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  WithStatement?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  TSModuleBlock?: (("always" | "never") | {
    multiline?: boolean
    minElements?: number
    consistent?: boolean
  })
  multiline?: boolean
  minElements?: number
  consistent?: boolean
})]
// ----- @stylistic/dot-location -----
type StylisticDotLocation = []|[("object" | "property")]
// ----- @stylistic/eol-last -----
type StylisticEolLast = []|[("always" | "never" | "unix" | "windows")]
// ----- @stylistic/exp-jsx-props-style -----
type StylisticExpJsxPropsStyle = []|[{
  singleLine?: {
    maxItems?: number
  }
  multiLine?: {
    minItems?: number
    maxItemsPerLine?: number
  }
}]
// ----- @stylistic/exp-list-style -----
type StylisticExpListStyle = []|[{
  singleLine?: _StylisticExpListStyle_SingleLineConfig
  multiLine?: _StylisticExpListStyle_MultiLineConfig
  overrides?: {
    "()"?: (_StylisticExpListStyle_BaseConfig | "off")
    "[]"?: (_StylisticExpListStyle_BaseConfig | "off")
    "{}"?: (_StylisticExpListStyle_BaseConfig | "off")
    "<>"?: (_StylisticExpListStyle_BaseConfig | "off")
    ArrayExpression?: (_StylisticExpListStyle_BaseConfig | "off")
    ArrayPattern?: (_StylisticExpListStyle_BaseConfig | "off")
    ArrowFunctionExpression?: (_StylisticExpListStyle_BaseConfig | "off")
    CallExpression?: (_StylisticExpListStyle_BaseConfig | "off")
    ExportNamedDeclaration?: (_StylisticExpListStyle_BaseConfig | "off")
    FunctionDeclaration?: (_StylisticExpListStyle_BaseConfig | "off")
    FunctionExpression?: (_StylisticExpListStyle_BaseConfig | "off")
    IfStatement?: (_StylisticExpListStyle_BaseConfig | "off")
    ImportAttributes?: (_StylisticExpListStyle_BaseConfig | "off")
    ImportDeclaration?: (_StylisticExpListStyle_BaseConfig | "off")
    JSONArrayExpression?: (_StylisticExpListStyle_BaseConfig | "off")
    JSONObjectExpression?: (_StylisticExpListStyle_BaseConfig | "off")
    NewExpression?: (_StylisticExpListStyle_BaseConfig | "off")
    ObjectExpression?: (_StylisticExpListStyle_BaseConfig | "off")
    ObjectPattern?: (_StylisticExpListStyle_BaseConfig | "off")
    TSDeclareFunction?: (_StylisticExpListStyle_BaseConfig | "off")
    TSEnumBody?: (_StylisticExpListStyle_BaseConfig | "off")
    TSFunctionType?: (_StylisticExpListStyle_BaseConfig | "off")
    TSInterfaceBody?: (_StylisticExpListStyle_BaseConfig | "off")
    TSTupleType?: (_StylisticExpListStyle_BaseConfig | "off")
    TSTypeLiteral?: (_StylisticExpListStyle_BaseConfig | "off")
    TSTypeParameterDeclaration?: (_StylisticExpListStyle_BaseConfig | "off")
    TSTypeParameterInstantiation?: (_StylisticExpListStyle_BaseConfig | "off")
  }
}]
interface _StylisticExpListStyle_SingleLineConfig {
  spacing?: ("always" | "never")
  maxItems?: number
}
interface _StylisticExpListStyle_MultiLineConfig {
  minItems?: number
}
interface _StylisticExpListStyle_BaseConfig {
  singleLine?: _StylisticExpListStyle_SingleLineConfig
  multiline?: _StylisticExpListStyle_MultiLineConfig
}
// ----- @stylistic/function-call-argument-newline -----
type StylisticFunctionCallArgumentNewline = []|[("always" | "never" | "consistent")]
// ----- @stylistic/function-call-spacing -----
type StylisticFunctionCallSpacing = ([]|["never"] | []|["always"]|["always", {
  allowNewlines?: boolean
  optionalChain?: {
    before?: boolean
    after?: boolean
  }
}])
// ----- @stylistic/function-paren-newline -----
type StylisticFunctionParenNewline = []|[(("always" | "never" | "consistent" | "multiline" | "multiline-arguments") | {
  minItems?: number
})]
// ----- @stylistic/generator-star-spacing -----
type StylisticGeneratorStarSpacing = []|[(("before" | "after" | "both" | "neither") | {
  before?: boolean
  after?: boolean
  named?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  anonymous?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  method?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  shorthand?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
})]
// ----- @stylistic/implicit-arrow-linebreak -----
type StylisticImplicitArrowLinebreak = []|[("beside" | "below")]
// ----- @stylistic/indent -----
type StylisticIndent = []|[("tab" | number)]|[("tab" | number), {
  SwitchCase?: number
  VariableDeclarator?: ((number | ("first" | "off")) | {
    var?: (number | ("first" | "off"))
    let?: (number | ("first" | "off"))
    const?: (number | ("first" | "off"))
    using?: (number | ("first" | "off"))
  })
  assignmentOperator?: (number | "off")
  outerIIFEBody?: (number | "off")
  MemberExpression?: (number | "off")
  FunctionDeclaration?: {
    parameters?: (number | ("first" | "off"))
    body?: number
    returnType?: number
  }
  FunctionExpression?: {
    parameters?: (number | ("first" | "off"))
    body?: number
    returnType?: number
  }
  StaticBlock?: {
    body?: number
  }
  CallExpression?: {
    arguments?: (number | ("first" | "off"))
  }
  ArrayExpression?: (number | ("first" | "off"))
  ObjectExpression?: (number | ("first" | "off"))
  ImportDeclaration?: (number | ("first" | "off"))
  flatTernaryExpressions?: boolean
  offsetTernaryExpressions?: (boolean | {
    CallExpression?: boolean
    AwaitExpression?: boolean
    NewExpression?: boolean
  })
  offsetTernaryExpressionsOffsetCallExpressions?: boolean
  ignoredNodes?: string[]
  ignoreComments?: boolean
  tabLength?: number
}]
// ----- @stylistic/indent-binary-ops -----
type StylisticIndentBinaryOps = []|[(number | "tab")]
// ----- @stylistic/jsx-closing-bracket-location -----
type StylisticJsxClosingBracketLocation = []|[(("after-props" | "props-aligned" | "tag-aligned" | "line-aligned") | {
  location?: ("after-props" | "props-aligned" | "tag-aligned" | "line-aligned")
} | {
  nonEmpty?: (("after-props" | "props-aligned" | "tag-aligned" | "line-aligned") | false)
  selfClosing?: (("after-props" | "props-aligned" | "tag-aligned" | "line-aligned") | false)
})]
// ----- @stylistic/jsx-closing-tag-location -----
type StylisticJsxClosingTagLocation = []|[("tag-aligned" | "line-aligned")]
// ----- @stylistic/jsx-curly-brace-presence -----
type StylisticJsxCurlyBracePresence = []|[({
  props?: ("always" | "never" | "ignore")
  children?: ("always" | "never" | "ignore")
  propElementValues?: ("always" | "never" | "ignore")
} | ("always" | "never" | "ignore"))]
// ----- @stylistic/jsx-curly-newline -----
type StylisticJsxCurlyNewline = []|[(("consistent" | "never") | {
  singleline?: ("consistent" | "require" | "forbid")
  multiline?: ("consistent" | "require" | "forbid")
})]
// ----- @stylistic/jsx-curly-spacing -----
type StylisticJsxCurlySpacing = []|[({
  when?: ("always" | "never")
  allowMultiline?: boolean
  spacing?: {
    objectLiterals?: ("always" | "never")
  }
  attributes?: ({
    when?: ("always" | "never")
    allowMultiline?: boolean
    spacing?: {
      objectLiterals?: ("always" | "never")
    }
  } | boolean)
  children?: ({
    when?: ("always" | "never")
    allowMultiline?: boolean
    spacing?: {
      objectLiterals?: ("always" | "never")
    }
  } | boolean)
} | ("always" | "never"))]|[({
  when?: ("always" | "never")
  allowMultiline?: boolean
  spacing?: {
    objectLiterals?: ("always" | "never")
  }
  attributes?: ({
    when?: ("always" | "never")
    allowMultiline?: boolean
    spacing?: {
      objectLiterals?: ("always" | "never")
    }
  } | boolean)
  children?: ({
    when?: ("always" | "never")
    allowMultiline?: boolean
    spacing?: {
      objectLiterals?: ("always" | "never")
    }
  } | boolean)
} | ("always" | "never")), {
  allowMultiline?: boolean
  spacing?: {
    objectLiterals?: ("always" | "never")
  }
}]
// ----- @stylistic/jsx-equals-spacing -----
type StylisticJsxEqualsSpacing = []|[("always" | "never")]
// ----- @stylistic/jsx-first-prop-new-line -----
type StylisticJsxFirstPropNewLine = []|[("always" | "never" | "multiline" | "multiline-multiprop" | "multiprop")]
// ----- @stylistic/jsx-function-call-newline -----
type StylisticJsxFunctionCallNewline = []|[("always" | "multiline")]
// ----- @stylistic/jsx-indent -----
type StylisticJsxIndent = []|[("tab" | number)]|[("tab" | number), {
  checkAttributes?: boolean
  indentLogicalExpressions?: boolean
}]
// ----- @stylistic/jsx-indent-props -----
type StylisticJsxIndentProps = []|[(("tab" | "first") | number | {
  indentMode?: (("tab" | "first") | number)
  ignoreTernaryOperator?: boolean
})]
// ----- @stylistic/jsx-max-props-per-line -----
type StylisticJsxMaxPropsPerLine = []|[({
  maximum?: {
    single?: number
    multi?: number
  }
} | {
  maximum?: number
  when?: ("always" | "multiline")
})]
// ----- @stylistic/jsx-newline -----
type StylisticJsxNewline = []|[{
  prevent?: boolean
  allowMultilines?: boolean
}]
// ----- @stylistic/jsx-one-expression-per-line -----
type StylisticJsxOneExpressionPerLine = []|[{
  allow?: ("none" | "literal" | "single-child" | "single-line" | "non-jsx")
}]
// ----- @stylistic/jsx-pascal-case -----
type StylisticJsxPascalCase = []|[{
  allowAllCaps?: boolean
  allowLeadingUnderscore?: boolean
  allowNamespace?: boolean
  ignore?: string[]
}]
// ----- @stylistic/jsx-quotes -----
type StylisticJsxQuotes = []|[("prefer-single" | "prefer-double")]
// ----- @stylistic/jsx-self-closing-comp -----
type StylisticJsxSelfClosingComp = []|[{
  component?: boolean
  html?: boolean
}]
// ----- @stylistic/jsx-sort-props -----
type StylisticJsxSortProps = []|[{
  callbacksLast?: boolean
  shorthandFirst?: boolean
  shorthandLast?: boolean
  multiline?: ("ignore" | "first" | "last")
  ignoreCase?: boolean
  noSortAlphabetically?: boolean
  reservedFirst?: (string[] | boolean)
  reservedLast?: string[]
  locale?: string
}]
// ----- @stylistic/jsx-tag-spacing -----
type StylisticJsxTagSpacing = []|[{
  closingSlash?: ("always" | "never" | "allow")
  beforeSelfClosing?: ("always" | "proportional-always" | "never" | "allow")
  afterOpening?: ("always" | "allow-multiline" | "never" | "allow")
  beforeClosing?: ("always" | "proportional-always" | "never" | "allow")
}]
// ----- @stylistic/jsx-wrap-multilines -----
type StylisticJsxWrapMultilines = []|[{
  declaration?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  assignment?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  return?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  arrow?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  condition?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  logical?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  prop?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
  propertyValue?: ((true | false | "ignore" | "parens" | "parens-new-line") | (true | false | "ignore" | "parens" | "parens-new-line"))
}]
// ----- @stylistic/key-spacing -----
type StylisticKeySpacing = []|[({
  align?: (("colon" | "value") | {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  })
  mode?: ("strict" | "minimum")
  beforeColon?: boolean
  afterColon?: boolean
  ignoredNodes?: ("ObjectExpression" | "ObjectPattern" | "ImportDeclaration" | "ExportNamedDeclaration" | "ExportAllDeclaration" | "TSTypeLiteral" | "TSInterfaceBody" | "ClassBody")[]
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    align?: (("colon" | "value") | {
      mode?: ("strict" | "minimum")
      on?: ("colon" | "value")
      beforeColon?: boolean
      afterColon?: boolean
    })
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  align?: {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  }
})]
// ----- @stylistic/keyword-spacing -----
type StylisticKeywordSpacing = []|[{
  before?: boolean
  after?: boolean
  overrides?: {
    abstract?: {
      before?: boolean
      after?: boolean
    }
    boolean?: {
      before?: boolean
      after?: boolean
    }
    break?: {
      before?: boolean
      after?: boolean
    }
    byte?: {
      before?: boolean
      after?: boolean
    }
    case?: {
      before?: boolean
      after?: boolean
    }
    catch?: {
      before?: boolean
      after?: boolean
    }
    char?: {
      before?: boolean
      after?: boolean
    }
    class?: {
      before?: boolean
      after?: boolean
    }
    const?: {
      before?: boolean
      after?: boolean
    }
    continue?: {
      before?: boolean
      after?: boolean
    }
    debugger?: {
      before?: boolean
      after?: boolean
    }
    default?: {
      before?: boolean
      after?: boolean
    }
    delete?: {
      before?: boolean
      after?: boolean
    }
    do?: {
      before?: boolean
      after?: boolean
    }
    double?: {
      before?: boolean
      after?: boolean
    }
    else?: {
      before?: boolean
      after?: boolean
    }
    enum?: {
      before?: boolean
      after?: boolean
    }
    export?: {
      before?: boolean
      after?: boolean
    }
    extends?: {
      before?: boolean
      after?: boolean
    }
    false?: {
      before?: boolean
      after?: boolean
    }
    final?: {
      before?: boolean
      after?: boolean
    }
    finally?: {
      before?: boolean
      after?: boolean
    }
    float?: {
      before?: boolean
      after?: boolean
    }
    for?: {
      before?: boolean
      after?: boolean
    }
    function?: {
      before?: boolean
      after?: boolean
    }
    goto?: {
      before?: boolean
      after?: boolean
    }
    if?: {
      before?: boolean
      after?: boolean
    }
    implements?: {
      before?: boolean
      after?: boolean
    }
    import?: {
      before?: boolean
      after?: boolean
    }
    in?: {
      before?: boolean
      after?: boolean
    }
    instanceof?: {
      before?: boolean
      after?: boolean
    }
    int?: {
      before?: boolean
      after?: boolean
    }
    interface?: {
      before?: boolean
      after?: boolean
    }
    long?: {
      before?: boolean
      after?: boolean
    }
    native?: {
      before?: boolean
      after?: boolean
    }
    new?: {
      before?: boolean
      after?: boolean
    }
    null?: {
      before?: boolean
      after?: boolean
    }
    package?: {
      before?: boolean
      after?: boolean
    }
    private?: {
      before?: boolean
      after?: boolean
    }
    protected?: {
      before?: boolean
      after?: boolean
    }
    public?: {
      before?: boolean
      after?: boolean
    }
    return?: {
      before?: boolean
      after?: boolean
    }
    short?: {
      before?: boolean
      after?: boolean
    }
    static?: {
      before?: boolean
      after?: boolean
    }
    super?: {
      before?: boolean
      after?: boolean
    }
    switch?: {
      before?: boolean
      after?: boolean
    }
    synchronized?: {
      before?: boolean
      after?: boolean
    }
    this?: {
      before?: boolean
      after?: boolean
    }
    throw?: {
      before?: boolean
      after?: boolean
    }
    throws?: {
      before?: boolean
      after?: boolean
    }
    transient?: {
      before?: boolean
      after?: boolean
    }
    true?: {
      before?: boolean
      after?: boolean
    }
    try?: {
      before?: boolean
      after?: boolean
    }
    typeof?: {
      before?: boolean
      after?: boolean
    }
    var?: {
      before?: boolean
      after?: boolean
    }
    void?: {
      before?: boolean
      after?: boolean
    }
    volatile?: {
      before?: boolean
      after?: boolean
    }
    while?: {
      before?: boolean
      after?: boolean
    }
    with?: {
      before?: boolean
      after?: boolean
    }
    arguments?: {
      before?: boolean
      after?: boolean
    }
    as?: {
      before?: boolean
      after?: boolean
    }
    async?: {
      before?: boolean
      after?: boolean
    }
    await?: {
      before?: boolean
      after?: boolean
    }
    eval?: {
      before?: boolean
      after?: boolean
    }
    from?: {
      before?: boolean
      after?: boolean
    }
    get?: {
      before?: boolean
      after?: boolean
    }
    let?: {
      before?: boolean
      after?: boolean
    }
    of?: {
      before?: boolean
      after?: boolean
    }
    set?: {
      before?: boolean
      after?: boolean
    }
    type?: {
      before?: boolean
      after?: boolean
    }
    using?: {
      before?: boolean
      after?: boolean
    }
    yield?: {
      before?: boolean
      after?: boolean
    }
    accessor?: {
      before?: boolean
      after?: boolean
    }
    satisfies?: {
      before?: boolean
      after?: boolean
    }
  }
}]
// ----- @stylistic/line-comment-position -----
type StylisticLineCommentPosition = []|[(("above" | "beside") | {
  position?: ("above" | "beside")
  ignorePattern?: string
  applyDefaultPatterns?: boolean
  applyDefaultIgnorePatterns?: boolean
})]
// ----- @stylistic/linebreak-style -----
type StylisticLinebreakStyle = []|[("unix" | "windows")]
// ----- @stylistic/lines-around-comment -----
type StylisticLinesAroundComment = []|[{
  beforeBlockComment?: boolean
  afterBlockComment?: boolean
  beforeLineComment?: boolean
  afterLineComment?: boolean
  allowBlockStart?: boolean
  allowBlockEnd?: boolean
  allowClassStart?: boolean
  allowClassEnd?: boolean
  allowObjectStart?: boolean
  allowObjectEnd?: boolean
  allowArrayStart?: boolean
  allowArrayEnd?: boolean
  allowInterfaceStart?: boolean
  allowInterfaceEnd?: boolean
  allowTypeStart?: boolean
  allowTypeEnd?: boolean
  allowEnumStart?: boolean
  allowEnumEnd?: boolean
  allowModuleStart?: boolean
  allowModuleEnd?: boolean
  ignorePattern?: string
  applyDefaultIgnorePatterns?: boolean
  afterHashbangComment?: boolean
}]
// ----- @stylistic/lines-between-class-members -----
type StylisticLinesBetweenClassMembers = []|[({
  
  enforce: [{
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  }, ...({
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  })[]]
} | ("always" | "never"))]|[({
  
  enforce: [{
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  }, ...({
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  })[]]
} | ("always" | "never")), {
  exceptAfterSingleLine?: boolean
  exceptAfterOverload?: boolean
}]
// ----- @stylistic/max-len -----
type StylisticMaxLen = []|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number)]|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), ({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number)]|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), ({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), {
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
}]
// ----- @stylistic/max-statements-per-line -----
type StylisticMaxStatementsPerLine = []|[{
  max?: number
  ignoredNodes?: ("BreakStatement" | "ClassDeclaration" | "ContinueStatement" | "DebuggerStatement" | "DoWhileStatement" | "ExpressionStatement" | "ForInStatement" | "ForOfStatement" | "ForStatement" | "FunctionDeclaration" | "IfStatement" | "ImportDeclaration" | "LabeledStatement" | "ReturnStatement" | "SwitchStatement" | "ThrowStatement" | "TryStatement" | "VariableDeclaration" | "WhileStatement" | "WithStatement" | "ExportNamedDeclaration" | "ExportDefaultDeclaration" | "ExportAllDeclaration")[]
}]
// ----- @stylistic/member-delimiter-style -----
type StylisticMemberDelimiterStyle = []|[{
  multiline?: {
    delimiter?: ("none" | "semi" | "comma")
    requireLast?: boolean
  }
  singleline?: {
    delimiter?: ("semi" | "comma")
    requireLast?: boolean
  }
  overrides?: {
    interface?: _StylisticMemberDelimiterStyle_DelimiterConfig
    typeLiteral?: _StylisticMemberDelimiterStyle_DelimiterConfig
  }
  multilineDetection?: ("brackets" | "last-member")
}]
interface _StylisticMemberDelimiterStyle_DelimiterConfig {
  multiline?: {
    delimiter?: ("none" | "semi" | "comma")
    requireLast?: boolean
  }
  singleline?: {
    delimiter?: ("semi" | "comma")
    requireLast?: boolean
  }
}
// ----- @stylistic/multiline-comment-style -----
type StylisticMultilineCommentStyle = ([]|[("starred-block" | "bare-block")] | []|["separate-lines"]|["separate-lines", {
  checkJSDoc?: boolean
  checkExclamation?: boolean
}])
// ----- @stylistic/multiline-ternary -----
type StylisticMultilineTernary = []|[("always" | "always-multiline" | "never")]|[("always" | "always-multiline" | "never"), {
  ignoreJSX?: boolean
}]
// ----- @stylistic/new-parens -----
type StylisticNewParens = []|[("always" | "never")]
// ----- @stylistic/newline-per-chained-call -----
type StylisticNewlinePerChainedCall = []|[{
  ignoreChainWithDepth?: number
}]
// ----- @stylistic/no-confusing-arrow -----
type StylisticNoConfusingArrow = []|[{
  allowParens?: boolean
  onlyOneSimpleParam?: boolean
}]
// ----- @stylistic/no-extra-parens -----
type StylisticNoExtraParens = ([]|["functions"] | []|["all"]|["all", {
  conditionalAssign?: boolean
  ternaryOperandBinaryExpressions?: boolean
  nestedBinaryExpressions?: boolean
  returnAssign?: boolean
  ignoreJSX?: ("none" | "all" | "single-line" | "multi-line")
  enforceForArrowConditionals?: boolean
  enforceForSequenceExpressions?: boolean
  enforceForNewInMemberExpressions?: boolean
  enforceForFunctionPrototypeMethods?: boolean
  allowParensAfterCommentPattern?: string
  nestedConditionalExpressions?: boolean
  allowNodesInSpreadElement?: {
    ConditionalExpression?: boolean
    LogicalExpression?: boolean
    AwaitExpression?: boolean
  }
  ignoredNodes?: string[]
}])
// ----- @stylistic/no-mixed-operators -----
type StylisticNoMixedOperators = []|[{
  groups?: [("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"), ("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"), ...(("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"))[]][]
  allowSamePrecedence?: boolean
}]
// ----- @stylistic/no-mixed-spaces-and-tabs -----
type StylisticNoMixedSpacesAndTabs = []|[("smart-tabs" | boolean)]
// ----- @stylistic/no-multi-spaces -----
type StylisticNoMultiSpaces = []|[{
  exceptions?: {
    [k: string]: boolean
  }
  ignoreEOLComments?: boolean
  includeTabs?: boolean
}]
// ----- @stylistic/no-multiple-empty-lines -----
type StylisticNoMultipleEmptyLines = []|[{
  max: number
  maxEOF?: number
  maxBOF?: number
}]
// ----- @stylistic/no-tabs -----
type StylisticNoTabs = []|[{
  allowIndentationTabs?: boolean
}]
// ----- @stylistic/no-trailing-spaces -----
type StylisticNoTrailingSpaces = []|[{
  skipBlankLines?: boolean
  ignoreComments?: boolean
}]
// ----- @stylistic/nonblock-statement-body-position -----
type StylisticNonblockStatementBodyPosition = []|[("beside" | "below" | "any")]|[("beside" | "below" | "any"), {
  overrides?: {
    if?: ("beside" | "below" | "any")
    else?: ("beside" | "below" | "any")
    while?: ("beside" | "below" | "any")
    do?: ("beside" | "below" | "any")
    for?: ("beside" | "below" | "any")
  }
}]
// ----- @stylistic/object-curly-newline -----
type StylisticObjectCurlyNewline = []|[((("always" | "never") | {
  multiline?: boolean
  minProperties?: number
  consistent?: boolean
}) | {
  ObjectExpression?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ObjectPattern?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ImportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ExportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSTypeLiteral?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSInterfaceBody?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSEnumBody?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
})]
// ----- @stylistic/object-curly-spacing -----
type StylisticObjectCurlySpacing = []|[("always" | "never")]|[("always" | "never"), {
  arraysInObjects?: boolean
  objectsInObjects?: boolean
  overrides?: {
    ObjectPattern?: ("always" | "never")
    ObjectExpression?: ("always" | "never")
    ImportDeclaration?: ("always" | "never")
    ImportAttributes?: ("always" | "never")
    ExportNamedDeclaration?: ("always" | "never")
    ExportAllDeclaration?: ("always" | "never")
    TSMappedType?: ("always" | "never")
    TSTypeLiteral?: ("always" | "never")
    TSInterfaceBody?: ("always" | "never")
    TSEnumBody?: ("always" | "never")
  }
  emptyObjects?: ("ignore" | "always" | "never")
}]
// ----- @stylistic/object-property-newline -----
type StylisticObjectPropertyNewline = []|[{
  allowAllPropertiesOnSameLine?: boolean
}]
// ----- @stylistic/one-var-declaration-per-line -----
type StylisticOneVarDeclarationPerLine = []|[("always" | "initializations")]
// ----- @stylistic/operator-linebreak -----
type StylisticOperatorLinebreak = []|[(("after" | "before" | "none") | null)]|[(("after" | "before" | "none") | null), {
  overrides?: {
    [k: string]: ("after" | "before" | "none" | "ignore") | undefined
  }
}]
// ----- @stylistic/padded-blocks -----
type StylisticPaddedBlocks = []|[(("always" | "never" | "start" | "end") | {
  blocks?: ("always" | "never" | "start" | "end")
  switches?: ("always" | "never" | "start" | "end")
  classes?: ("always" | "never" | "start" | "end")
})]|[(("always" | "never" | "start" | "end") | {
  blocks?: ("always" | "never" | "start" | "end")
  switches?: ("always" | "never" | "start" | "end")
  classes?: ("always" | "never" | "start" | "end")
}), {
  allowSingleLineBlocks?: boolean
}]
// ----- @stylistic/padding-line-between-statements -----
type _StylisticPaddingLineBetweenStatementsPaddingType = ("any" | "never" | "always")
type _StylisticPaddingLineBetweenStatementsStatementOption = (_StylisticPaddingLineBetweenStatementsStatementMatcher | [_StylisticPaddingLineBetweenStatementsStatementMatcher, ...(_StylisticPaddingLineBetweenStatementsStatementMatcher)[]])
type _StylisticPaddingLineBetweenStatementsStatementMatcher = (_StylisticPaddingLineBetweenStatementsStatementType | _StylisticPaddingLineBetweenStatements_SelectorOption)
type _StylisticPaddingLineBetweenStatementsStatementType = ("*" | "exports" | "require" | "directive" | "iife" | "block" | "empty" | "function" | "ts-method" | "break" | "case" | "class" | "continue" | "debugger" | "default" | "do" | "for" | "if" | "import" | "switch" | "throw" | "try" | "while" | "with" | "cjs-export" | "cjs-import" | "enum" | "interface" | "function-overload" | "block-like" | "singleline-block-like" | "multiline-block-like" | "expression" | "singleline-expression" | "multiline-expression" | "return" | "singleline-return" | "multiline-return" | "export" | "singleline-export" | "multiline-export" | "var" | "singleline-var" | "multiline-var" | "let" | "singleline-let" | "multiline-let" | "const" | "singleline-const" | "multiline-const" | "using" | "singleline-using" | "multiline-using" | "type" | "singleline-type" | "multiline-type")
type StylisticPaddingLineBetweenStatements = {
  blankLine: _StylisticPaddingLineBetweenStatementsPaddingType
  prev: _StylisticPaddingLineBetweenStatementsStatementOption
  next: _StylisticPaddingLineBetweenStatementsStatementOption
}[]
interface _StylisticPaddingLineBetweenStatements_SelectorOption {
  selector: string
  lineMode?: ("any" | "singleline" | "multiline")
}
// ----- @stylistic/quote-props -----
type StylisticQuoteProps = ([]|[("always" | "as-needed" | "consistent" | "consistent-as-needed")] | []|[("always" | "as-needed" | "consistent" | "consistent-as-needed")]|[("always" | "as-needed" | "consistent" | "consistent-as-needed"), {
  keywords?: boolean
  unnecessary?: boolean
  numbers?: boolean
}])
// ----- @stylistic/quotes -----
type StylisticQuotes = []|[("single" | "double" | "backtick")]|[("single" | "double" | "backtick"), ("avoid-escape" | {
  avoidEscape?: boolean
  allowTemplateLiterals?: (boolean | ("never" | "avoidEscape" | "always"))
  ignoreStringLiterals?: boolean
})]
// ----- @stylistic/rest-spread-spacing -----
type StylisticRestSpreadSpacing = []|[("always" | "never")]
// ----- @stylistic/semi -----
type StylisticSemi = ([]|["never"]|["never", {
  beforeStatementContinuationChars?: ("always" | "any" | "never")
}] | []|["always"]|["always", {
  omitLastInOneLineBlock?: boolean
  omitLastInOneLineClassBody?: boolean
}])
// ----- @stylistic/semi-spacing -----
type StylisticSemiSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- @stylistic/semi-style -----
type StylisticSemiStyle = []|[("last" | "first")]
// ----- @stylistic/space-before-blocks -----
type StylisticSpaceBeforeBlocks = []|[(("always" | "never") | {
  keywords?: ("always" | "never" | "off")
  functions?: ("always" | "never" | "off")
  classes?: ("always" | "never" | "off")
  modules?: ("always" | "never" | "off")
})]
// ----- @stylistic/space-before-function-paren -----
type StylisticSpaceBeforeFunctionParen = []|[(("always" | "never") | {
  anonymous?: ("always" | "never" | "ignore")
  named?: ("always" | "never" | "ignore")
  asyncArrow?: ("always" | "never" | "ignore")
  catch?: ("always" | "never" | "ignore")
})]
// ----- @stylistic/space-in-parens -----
type StylisticSpaceInParens = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: ("{}" | "[]" | "()" | "empty")[]
}]
// ----- @stylistic/space-infix-ops -----
type StylisticSpaceInfixOps = []|[{
  int32Hint?: boolean
  ignoreTypes?: boolean
}]
// ----- @stylistic/space-unary-ops -----
type StylisticSpaceUnaryOps = []|[{
  words?: boolean
  nonwords?: boolean
  overrides?: {
    [k: string]: boolean | undefined
  }
}]
// ----- @stylistic/spaced-comment -----
type StylisticSpacedComment = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: string[]
  markers?: string[]
  line?: {
    exceptions?: string[]
    markers?: string[]
  }
  block?: {
    exceptions?: string[]
    markers?: string[]
    balanced?: boolean
  }
}]
// ----- @stylistic/switch-colon-spacing -----
type StylisticSwitchColonSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- @stylistic/template-curly-spacing -----
type StylisticTemplateCurlySpacing = []|[("always" | "never")]
// ----- @stylistic/template-tag-spacing -----
type StylisticTemplateTagSpacing = []|[("always" | "never")]
// ----- @stylistic/type-annotation-spacing -----
type StylisticTypeAnnotationSpacing = []|[{
  before?: boolean
  after?: boolean
  overrides?: {
    colon?: _StylisticTypeAnnotationSpacing_SpacingConfig
    arrow?: ("ignore" | _StylisticTypeAnnotationSpacing_SpacingConfig)
    variable?: _StylisticTypeAnnotationSpacing_SpacingConfig
    parameter?: _StylisticTypeAnnotationSpacing_SpacingConfig
    property?: _StylisticTypeAnnotationSpacing_SpacingConfig
    returnType?: _StylisticTypeAnnotationSpacing_SpacingConfig
  }
}]
interface _StylisticTypeAnnotationSpacing_SpacingConfig {
  before?: boolean
  after?: boolean
}
// ----- @stylistic/wrap-iife -----
type StylisticWrapIife = []|[("outside" | "inside" | "any")]|[("outside" | "inside" | "any"), {
  functionPrototypeMethods?: boolean
}]
// ----- @stylistic/yield-star-spacing -----
type StylisticYieldStarSpacing = []|[(("before" | "after" | "both" | "neither") | {
  before?: boolean
  after?: boolean
})]
// ----- @tanstack/query/exhaustive-deps -----
type TanstackQueryExhaustiveDeps = []|[{
  allowlist?: {
    variables?: string[]
    types?: string[]
  }
}]
// ----- @typescript-eslint/array-type -----
type TypescriptEslintArrayType = []|[{
  
  default?: ("array" | "generic" | "array-simple")
  
  readonly?: ("array" | "generic" | "array-simple")
}]
// ----- @typescript-eslint/ban-ts-comment -----
type TypescriptEslintBanTsComment = []|[{
  
  minimumDescriptionLength?: number
  
  "ts-check"?: (boolean | "allow-with-description" | {
    descriptionFormat?: string
  })
  
  "ts-expect-error"?: (boolean | "allow-with-description" | {
    descriptionFormat?: string
  })
  
  "ts-ignore"?: (boolean | "allow-with-description" | {
    descriptionFormat?: string
  })
  
  "ts-nocheck"?: (boolean | "allow-with-description" | {
    descriptionFormat?: string
  })
}]
// ----- @typescript-eslint/class-literal-property-style -----
type TypescriptEslintClassLiteralPropertyStyle = []|[("fields" | "getters")]
// ----- @typescript-eslint/class-methods-use-this -----
type TypescriptEslintClassMethodsUseThis = []|[{
  
  enforceForClassFields?: boolean
  
  exceptMethods?: string[]
  
  ignoreClassesThatImplementAnInterface?: (boolean | "public-fields")
  
  ignoreOverrideMethods?: boolean
}]
// ----- @typescript-eslint/consistent-generic-constructors -----
type TypescriptEslintConsistentGenericConstructors = []|[("type-annotation" | "constructor")]
// ----- @typescript-eslint/consistent-indexed-object-style -----
type TypescriptEslintConsistentIndexedObjectStyle = []|[("record" | "index-signature")]
// ----- @typescript-eslint/consistent-return -----
type TypescriptEslintConsistentReturn = []|[{
  treatUndefinedAsUnspecified?: boolean
}]
// ----- @typescript-eslint/consistent-type-assertions -----
type TypescriptEslintConsistentTypeAssertions = []|[({
  
  assertionStyle: "never"
} | {
  
  arrayLiteralTypeAssertions?: ("allow" | "allow-as-parameter" | "never")
  
  assertionStyle?: ("as" | "angle-bracket")
  
  objectLiteralTypeAssertions?: ("allow" | "allow-as-parameter" | "never")
})]
// ----- @typescript-eslint/consistent-type-definitions -----
type TypescriptEslintConsistentTypeDefinitions = []|[("interface" | "type")]
// ----- @typescript-eslint/consistent-type-exports -----
type TypescriptEslintConsistentTypeExports = []|[{
  
  fixMixedExportsWithInlineTypeSpecifier?: boolean
}]
// ----- @typescript-eslint/consistent-type-imports -----
type TypescriptEslintConsistentTypeImports = []|[{
  
  disallowTypeAnnotations?: boolean
  
  fixStyle?: ("separate-type-imports" | "inline-type-imports")
  
  prefer?: ("type-imports" | "no-type-imports")
}]
// ----- @typescript-eslint/dot-notation -----
type TypescriptEslintDotNotation = []|[{
  
  allowIndexSignaturePropertyAccess?: boolean
  
  allowKeywords?: boolean
  
  allowPattern?: string
  
  allowPrivateClassPropertyAccess?: boolean
  
  allowProtectedClassPropertyAccess?: boolean
}]
// ----- @typescript-eslint/explicit-function-return-type -----
type TypescriptEslintExplicitFunctionReturnType = []|[{
  
  allowConciseArrowFunctionExpressionsStartingWithVoid?: boolean
  
  allowDirectConstAssertionInArrowFunctions?: boolean
  
  allowedNames?: string[]
  
  allowExpressions?: boolean
  
  allowFunctionsWithoutTypeParameters?: boolean
  
  allowHigherOrderFunctions?: boolean
  
  allowIIFEs?: boolean
  
  allowTypedFunctionExpressions?: boolean
}]
// ----- @typescript-eslint/explicit-member-accessibility -----
type TypescriptEslintExplicitMemberAccessibility = []|[{
  
  accessibility?: ("explicit" | "no-public" | "off")
  
  ignoredMethodNames?: string[]
  
  overrides?: {
    
    accessors?: ("explicit" | "no-public" | "off")
    
    constructors?: ("explicit" | "no-public" | "off")
    
    methods?: ("explicit" | "no-public" | "off")
    
    parameterProperties?: ("explicit" | "no-public" | "off")
    
    properties?: ("explicit" | "no-public" | "off")
  }
}]
// ----- @typescript-eslint/explicit-module-boundary-types -----
type TypescriptEslintExplicitModuleBoundaryTypes = []|[{
  
  allowArgumentsExplicitlyTypedAsAny?: boolean
  
  allowDirectConstAssertionInArrowFunctions?: boolean
  
  allowedNames?: string[]
  
  allowHigherOrderFunctions?: boolean
  
  allowOverloadFunctions?: boolean
  
  allowTypedFunctionExpressions?: boolean
}]
// ----- @typescript-eslint/init-declarations -----
type TypescriptEslintInitDeclarations = ([]|["always"] | []|["never"]|["never", {
  ignoreForLoopInit?: boolean
}])
// ----- @typescript-eslint/max-params -----
type TypescriptEslintMaxParams = []|[{
  
  countVoidThis?: boolean
  
  max?: number
  
  maximum?: number
}]
// ----- @typescript-eslint/member-ordering -----
type TypescriptEslintMemberOrdering = []|[{
  
  classes?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
  
  classExpressions?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
  
  default?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization") | ("readonly-signature" | "signature" | "readonly-field" | "public-readonly-field" | "public-decorated-readonly-field" | "decorated-readonly-field" | "static-readonly-field" | "public-static-readonly-field" | "instance-readonly-field" | "public-instance-readonly-field" | "abstract-readonly-field" | "public-abstract-readonly-field" | "protected-readonly-field" | "protected-decorated-readonly-field" | "protected-static-readonly-field" | "protected-instance-readonly-field" | "protected-abstract-readonly-field" | "private-readonly-field" | "private-decorated-readonly-field" | "private-static-readonly-field" | "private-instance-readonly-field" | "#private-readonly-field" | "#private-static-readonly-field" | "#private-instance-readonly-field" | "field" | "public-field" | "public-decorated-field" | "decorated-field" | "static-field" | "public-static-field" | "instance-field" | "public-instance-field" | "abstract-field" | "public-abstract-field" | "protected-field" | "protected-decorated-field" | "protected-static-field" | "protected-instance-field" | "protected-abstract-field" | "private-field" | "private-decorated-field" | "private-static-field" | "private-instance-field" | "#private-field" | "#private-static-field" | "#private-instance-field" | "method" | "public-method" | "public-decorated-method" | "decorated-method" | "static-method" | "public-static-method" | "instance-method" | "public-instance-method" | "abstract-method" | "public-abstract-method" | "protected-method" | "protected-decorated-method" | "protected-static-method" | "protected-instance-method" | "protected-abstract-method" | "private-method" | "private-decorated-method" | "private-static-method" | "private-instance-method" | "#private-method" | "#private-static-method" | "#private-instance-method" | "call-signature" | "constructor" | "public-constructor" | "protected-constructor" | "private-constructor" | "accessor" | "public-accessor" | "public-decorated-accessor" | "decorated-accessor" | "static-accessor" | "public-static-accessor" | "instance-accessor" | "public-instance-accessor" | "abstract-accessor" | "public-abstract-accessor" | "protected-accessor" | "protected-decorated-accessor" | "protected-static-accessor" | "protected-instance-accessor" | "protected-abstract-accessor" | "private-accessor" | "private-decorated-accessor" | "private-static-accessor" | "private-instance-accessor" | "#private-accessor" | "#private-static-accessor" | "#private-instance-accessor" | "get" | "public-get" | "public-decorated-get" | "decorated-get" | "static-get" | "public-static-get" | "instance-get" | "public-instance-get" | "abstract-get" | "public-abstract-get" | "protected-get" | "protected-decorated-get" | "protected-static-get" | "protected-instance-get" | "protected-abstract-get" | "private-get" | "private-decorated-get" | "private-static-get" | "private-instance-get" | "#private-get" | "#private-static-get" | "#private-instance-get" | "set" | "public-set" | "public-decorated-set" | "decorated-set" | "static-set" | "public-static-set" | "instance-set" | "public-instance-set" | "abstract-set" | "public-abstract-set" | "protected-set" | "protected-decorated-set" | "protected-static-set" | "protected-instance-set" | "protected-abstract-set" | "private-set" | "private-decorated-set" | "private-static-set" | "private-instance-set" | "#private-set" | "#private-static-set" | "#private-instance-set" | "static-initialization" | "static-static-initialization" | "public-static-static-initialization" | "instance-static-initialization" | "public-instance-static-initialization" | "abstract-static-initialization" | "public-abstract-static-initialization" | "protected-static-static-initialization" | "protected-instance-static-initialization" | "protected-abstract-static-initialization" | "private-static-static-initialization" | "private-instance-static-initialization" | "#private-static-static-initialization" | "#private-instance-static-initialization")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
  
  interfaces?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor") | ("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor") | ("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
  
  typeLiterals?: ("never" | (("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor") | ("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor")[])[] | {
    memberTypes?: ((("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor") | ("readonly-signature" | "signature" | "readonly-field" | "field" | "method" | "constructor")[])[] | "never")
    optionalityOrder?: ("optional-first" | "required-first")
    order?: ("alphabetically" | "alphabetically-case-insensitive" | "as-written" | "natural" | "natural-case-insensitive")
  })
}]
// ----- @typescript-eslint/method-signature-style -----
type TypescriptEslintMethodSignatureStyle = []|[("property" | "method")]
// ----- @typescript-eslint/naming-convention -----
type _TypescriptEslintNamingConventionFormatOptionsConfig = (_TypescriptEslintNamingConventionPredefinedFormats[] | null)
type _TypescriptEslintNamingConventionPredefinedFormats = ("camelCase" | "strictCamelCase" | "PascalCase" | "StrictPascalCase" | "snake_case" | "UPPER_CASE")
type _TypescriptEslintNamingConventionUnderscoreOptions = ("forbid" | "allow" | "require" | "requireDouble" | "allowDouble" | "allowSingleOrDouble")
type _TypescriptEslintNamingConvention_PrefixSuffixConfig = string[]
type _TypescriptEslintNamingConventionTypeModifiers = ("boolean" | "string" | "number" | "function" | "array")
type TypescriptEslintNamingConvention = ({
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  modifiers?: ("const" | "readonly" | "static" | "public" | "protected" | "private" | "#private" | "abstract" | "destructured" | "global" | "exported" | "unused" | "requiresQuotes" | "override" | "async" | "default" | "namespace")[]
  selector: ("default" | "variableLike" | "memberLike" | "typeLike" | "method" | "property" | "accessor" | "variable" | "function" | "parameter" | "parameterProperty" | "classicAccessor" | "enumMember" | "classMethod" | "objectLiteralMethod" | "typeMethod" | "classProperty" | "objectLiteralProperty" | "typeProperty" | "autoAccessor" | "class" | "interface" | "typeAlias" | "enum" | "typeParameter" | "import")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "default"
  modifiers?: ("const" | "readonly" | "static" | "public" | "protected" | "private" | "#private" | "abstract" | "destructured" | "global" | "exported" | "unused" | "requiresQuotes" | "override" | "async" | "default" | "namespace")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "variableLike"
  modifiers?: ("unused" | "async")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "variable"
  modifiers?: ("const" | "destructured" | "exported" | "global" | "unused" | "async")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "function"
  modifiers?: ("exported" | "global" | "unused" | "async")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "parameter"
  modifiers?: ("destructured" | "unused")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "memberLike"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "readonly" | "requiresQuotes" | "static" | "override" | "async")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "classProperty"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "readonly" | "requiresQuotes" | "static" | "override")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "objectLiteralProperty"
  modifiers?: ("public" | "requiresQuotes")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "typeProperty"
  modifiers?: ("public" | "readonly" | "requiresQuotes")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "parameterProperty"
  modifiers?: ("private" | "protected" | "public" | "readonly")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "property"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "readonly" | "requiresQuotes" | "static" | "override" | "async")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "classMethod"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "requiresQuotes" | "static" | "override" | "async")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "objectLiteralMethod"
  modifiers?: ("public" | "requiresQuotes" | "async")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "typeMethod"
  modifiers?: ("public" | "requiresQuotes")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "method"
  modifiers?: ("abstract" | "private" | "#private" | "protected" | "public" | "requiresQuotes" | "static" | "override" | "async")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "classicAccessor"
  modifiers?: ("abstract" | "private" | "protected" | "public" | "requiresQuotes" | "static" | "override")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "autoAccessor"
  modifiers?: ("abstract" | "private" | "protected" | "public" | "requiresQuotes" | "static" | "override")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "accessor"
  modifiers?: ("abstract" | "private" | "protected" | "public" | "requiresQuotes" | "static" | "override")[]
  types?: _TypescriptEslintNamingConventionTypeModifiers[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "enumMember"
  modifiers?: ("requiresQuotes")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "typeLike"
  modifiers?: ("abstract" | "exported" | "unused")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "class"
  modifiers?: ("abstract" | "exported" | "unused")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "interface"
  modifiers?: ("exported" | "unused")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "typeAlias"
  modifiers?: ("exported" | "unused")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "enum"
  modifiers?: ("exported" | "unused")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "typeParameter"
  modifiers?: ("unused")[]
} | {
  custom?: _TypescriptEslintNamingConvention_MatchRegexConfig
  failureMessage?: string
  format: _TypescriptEslintNamingConventionFormatOptionsConfig
  leadingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  prefix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  suffix?: _TypescriptEslintNamingConvention_PrefixSuffixConfig
  trailingUnderscore?: _TypescriptEslintNamingConventionUnderscoreOptions
  filter?: (string | _TypescriptEslintNamingConvention_MatchRegexConfig)
  selector: "import"
  modifiers?: ("default" | "namespace")[]
})[]
interface _TypescriptEslintNamingConvention_MatchRegexConfig {
  match: boolean
  regex: string
}
// ----- @typescript-eslint/no-base-to-string -----
type TypescriptEslintNoBaseToString = []|[{
  
  checkUnknown?: boolean
  
  ignoredTypeNames?: string[]
}]
// ----- @typescript-eslint/no-confusing-void-expression -----
type TypescriptEslintNoConfusingVoidExpression = []|[{
  
  ignoreArrowShorthand?: boolean
  
  ignoreVoidOperator?: boolean
  
  ignoreVoidReturningFunctions?: boolean
}]
// ----- @typescript-eslint/no-deprecated -----
type TypescriptEslintNoDeprecated = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
}]
// ----- @typescript-eslint/no-duplicate-type-constituents -----
type TypescriptEslintNoDuplicateTypeConstituents = []|[{
  
  ignoreIntersections?: boolean
  
  ignoreUnions?: boolean
}]
// ----- @typescript-eslint/no-empty-function -----
type TypescriptEslintNoEmptyFunction = []|[{
  
  allow?: ("functions" | "arrowFunctions" | "generatorFunctions" | "methods" | "generatorMethods" | "getters" | "setters" | "constructors" | "private-constructors" | "protected-constructors" | "asyncFunctions" | "asyncMethods" | "decoratedFunctions" | "overrideMethods")[]
}]
// ----- @typescript-eslint/no-empty-interface -----
type TypescriptEslintNoEmptyInterface = []|[{
  
  allowSingleExtends?: boolean
}]
// ----- @typescript-eslint/no-empty-object-type -----
type TypescriptEslintNoEmptyObjectType = []|[{
  
  allowInterfaces?: ("always" | "never" | "with-single-extends")
  
  allowObjectTypes?: ("always" | "never")
  
  allowWithName?: string
}]
// ----- @typescript-eslint/no-explicit-any -----
type TypescriptEslintNoExplicitAny = []|[{
  
  fixToUnknown?: boolean
  
  ignoreRestArgs?: boolean
}]
// ----- @typescript-eslint/no-extraneous-class -----
type TypescriptEslintNoExtraneousClass = []|[{
  
  allowConstructorOnly?: boolean
  
  allowEmpty?: boolean
  
  allowStaticOnly?: boolean
  
  allowWithDecorator?: boolean
}]
// ----- @typescript-eslint/no-floating-promises -----
type TypescriptEslintNoFloatingPromises = []|[{
  
  allowForKnownSafeCalls?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  allowForKnownSafePromises?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  checkThenables?: boolean
  
  ignoreIIFE?: boolean
  
  ignoreVoid?: boolean
}]
// ----- @typescript-eslint/no-inferrable-types -----
type TypescriptEslintNoInferrableTypes = []|[{
  
  ignoreParameters?: boolean
  
  ignoreProperties?: boolean
}]
// ----- @typescript-eslint/no-invalid-this -----
type TypescriptEslintNoInvalidThis = []|[{
  capIsConstructor?: boolean
}]
// ----- @typescript-eslint/no-invalid-void-type -----
type TypescriptEslintNoInvalidVoidType = []|[{
  
  allowAsThisParameter?: boolean
  
  allowInGenericTypeArguments?: (boolean | [string, ...(string)[]])
}]
// ----- @typescript-eslint/no-magic-numbers -----
type TypescriptEslintNoMagicNumbers = []|[{
  detectObjects?: boolean
  enforceConst?: boolean
  ignore?: (number | string)[]
  ignoreArrayIndexes?: boolean
  ignoreDefaultValues?: boolean
  ignoreClassFieldInitialValues?: boolean
  
  ignoreEnums?: boolean
  
  ignoreNumericLiteralTypes?: boolean
  
  ignoreReadonlyClassProperties?: boolean
  
  ignoreTypeIndexes?: boolean
}]
// ----- @typescript-eslint/no-meaningless-void-operator -----
type TypescriptEslintNoMeaninglessVoidOperator = []|[{
  
  checkNever?: boolean
}]
// ----- @typescript-eslint/no-misused-promises -----
type TypescriptEslintNoMisusedPromises = []|[{
  
  checksConditionals?: (boolean | {
    
    flagUnions?: ("all" | "strict" | "none")
  })
  
  checksSpreads?: boolean
  
  checksVoidReturn?: (boolean | {
    
    arguments?: boolean
    
    attributes?: boolean
    
    inheritedMethods?: boolean
    
    properties?: boolean
    
    returns?: boolean
    
    variables?: boolean
  })
}]
// ----- @typescript-eslint/no-misused-spread -----
type TypescriptEslintNoMisusedSpread = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
}]
// ----- @typescript-eslint/no-namespace -----
type TypescriptEslintNoNamespace = []|[{
  
  allowDeclarations?: boolean
  
  allowDefinitionFiles?: boolean
}]
// ----- @typescript-eslint/no-redeclare -----
type TypescriptEslintNoRedeclare = []|[{
  
  builtinGlobals?: boolean
  
  ignoreDeclarationMerge?: boolean
}]
// ----- @typescript-eslint/no-require-imports -----
type TypescriptEslintNoRequireImports = []|[{
  
  allow?: string[]
  
  allowAsImport?: boolean
}]
// ----- @typescript-eslint/no-restricted-imports -----
type TypescriptEslintNoRestrictedImports = ((string | {
  name: string
  message?: string
  importNames?: string[]
  allowImportNames?: string[]
  
  allowTypeImports?: boolean
})[] | []|[{
  paths?: (string | {
    name: string
    message?: string
    importNames?: string[]
    allowImportNames?: string[]
    
    allowTypeImports?: boolean
  })[]
  patterns?: (string[] | {
    
    importNames?: [string, ...(string)[]]
    
    allowImportNames?: [string, ...(string)[]]
    
    group?: [string, ...(string)[]]
    regex?: string
    importNamePattern?: string
    allowImportNamePattern?: string
    message?: string
    caseSensitive?: boolean
    
    allowTypeImports?: boolean
  }[])
}])
// ----- @typescript-eslint/no-restricted-types -----
type TypescriptEslintNoRestrictedTypes = []|[{
  
  types?: {
    [k: string]: (true | string | {
      
      fixWith?: string
      
      message?: string
      
      suggest?: string[]
    }) | undefined
  }
}]
// ----- @typescript-eslint/no-shadow -----
type TypescriptEslintNoShadow = []|[{
  
  allow?: string[]
  
  builtinGlobals?: boolean
  
  hoist?: ("all" | "functions" | "functions-and-types" | "never" | "types")
  
  ignoreFunctionTypeParameterNameValueShadow?: boolean
  
  ignoreOnInitialization?: boolean
  
  ignoreTypeValueShadow?: boolean
}]
// ----- @typescript-eslint/no-this-alias -----
type TypescriptEslintNoThisAlias = []|[{
  
  allowDestructuring?: boolean
  
  allowedNames?: string[]
}]
// ----- @typescript-eslint/no-type-alias -----
type TypescriptEslintNoTypeAlias = []|[{
  
  allowAliases?: ("always" | "never" | "in-unions" | "in-intersections" | "in-unions-and-intersections")
  
  allowCallbacks?: ("always" | "never")
  
  allowConditionalTypes?: ("always" | "never")
  
  allowConstructors?: ("always" | "never")
  
  allowGenerics?: ("always" | "never")
  
  allowLiterals?: ("always" | "never" | "in-unions" | "in-intersections" | "in-unions-and-intersections")
  
  allowMappedTypes?: ("always" | "never" | "in-unions" | "in-intersections" | "in-unions-and-intersections")
  
  allowTupleTypes?: ("always" | "never" | "in-unions" | "in-intersections" | "in-unions-and-intersections")
}]
// ----- @typescript-eslint/no-unnecessary-boolean-literal-compare -----
type TypescriptEslintNoUnnecessaryBooleanLiteralCompare = []|[{
  
  allowComparingNullableBooleansToFalse?: boolean
  
  allowComparingNullableBooleansToTrue?: boolean
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
}]
// ----- @typescript-eslint/no-unnecessary-condition -----
type TypescriptEslintNoUnnecessaryCondition = []|[{
  
  allowConstantLoopConditions?: (boolean | ("always" | "never" | "only-allowed-literals"))
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
  
  checkTypePredicates?: boolean
}]
// ----- @typescript-eslint/no-unnecessary-type-assertion -----
type TypescriptEslintNoUnnecessaryTypeAssertion = []|[{
  
  checkLiteralConstAssertions?: boolean
  
  typesToIgnore?: string[]
}]
// ----- @typescript-eslint/no-unsafe-member-access -----
type TypescriptEslintNoUnsafeMemberAccess = []|[{
  
  allowOptionalChaining?: boolean
}]
// ----- @typescript-eslint/no-unused-expressions -----
type TypescriptEslintNoUnusedExpressions = []|[{
  allowShortCircuit?: boolean
  allowTernary?: boolean
  allowTaggedTemplates?: boolean
  enforceForJSX?: boolean
  ignoreDirectives?: boolean
}]
// ----- @typescript-eslint/no-unused-vars -----
type TypescriptEslintNoUnusedVars = []|[(("all" | "local") | {
  
  args?: ("all" | "after-used" | "none")
  
  argsIgnorePattern?: string
  
  caughtErrors?: ("all" | "none")
  
  caughtErrorsIgnorePattern?: string
  
  destructuredArrayIgnorePattern?: string
  
  enableAutofixRemoval?: {
    
    imports?: boolean
  }
  
  ignoreClassWithStaticInitBlock?: boolean
  
  ignoreRestSiblings?: boolean
  
  ignoreUsingDeclarations?: boolean
  
  reportUsedIgnorePattern?: boolean
  
  vars?: ("all" | "local")
  
  varsIgnorePattern?: string
})]
// ----- @typescript-eslint/no-use-before-define -----
type TypescriptEslintNoUseBeforeDefine = []|[("nofunc" | {
  
  allowNamedExports?: boolean
  
  classes?: boolean
  
  enums?: boolean
  
  functions?: boolean
  
  ignoreTypeReferences?: boolean
  
  typedefs?: boolean
  
  variables?: boolean
})]
// ----- @typescript-eslint/no-useless-default-assignment -----
type TypescriptEslintNoUselessDefaultAssignment = []|[{
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
}]
// ----- @typescript-eslint/no-var-requires -----
type TypescriptEslintNoVarRequires = []|[{
  
  allow?: string[]
}]
// ----- @typescript-eslint/only-throw-error -----
type TypescriptEslintOnlyThrowError = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  allowRethrowing?: boolean
  
  allowThrowingAny?: boolean
  
  allowThrowingUnknown?: boolean
}]
// ----- @typescript-eslint/parameter-properties -----
type TypescriptEslintParameterProperties = []|[{
  
  allow?: ("readonly" | "private" | "protected" | "public" | "private readonly" | "protected readonly" | "public readonly")[]
  
  prefer?: ("class-property" | "parameter-property")
}]
// ----- @typescript-eslint/prefer-destructuring -----
type TypescriptEslintPreferDestructuring = []|[({
  AssignmentExpression?: {
    array?: boolean
    object?: boolean
  }
  VariableDeclarator?: {
    array?: boolean
    object?: boolean
  }
} | {
  array?: boolean
  object?: boolean
})]|[({
  AssignmentExpression?: {
    array?: boolean
    object?: boolean
  }
  VariableDeclarator?: {
    array?: boolean
    object?: boolean
  }
} | {
  array?: boolean
  object?: boolean
}), {
  
  enforceForDeclarationWithTypeAnnotation?: boolean
  
  enforceForRenamedProperties?: boolean
}]
// ----- @typescript-eslint/prefer-literal-enum-member -----
type TypescriptEslintPreferLiteralEnumMember = []|[{
  
  allowBitwiseExpressions?: boolean
}]
// ----- @typescript-eslint/prefer-nullish-coalescing -----
type TypescriptEslintPreferNullishCoalescing = []|[{
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
  
  ignoreBooleanCoercion?: boolean
  
  ignoreConditionalTests?: boolean
  
  ignoreIfStatements?: boolean
  
  ignoreMixedLogicalExpressions?: boolean
  
  ignorePrimitives?: ({
    
    bigint?: boolean
    
    boolean?: boolean
    
    number?: boolean
    
    string?: boolean
  } | true)
  
  ignoreTernaryTests?: boolean
}]
// ----- @typescript-eslint/prefer-optional-chain -----
type TypescriptEslintPreferOptionalChain = []|[{
  
  allowPotentiallyUnsafeFixesThatModifyTheReturnTypeIKnowWhatImDoing?: boolean
  
  checkAny?: boolean
  
  checkBigInt?: boolean
  
  checkBoolean?: boolean
  
  checkNumber?: boolean
  
  checkString?: boolean
  
  checkUnknown?: boolean
  
  requireNullish?: boolean
}]
// ----- @typescript-eslint/prefer-promise-reject-errors -----
type TypescriptEslintPreferPromiseRejectErrors = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  allowEmptyReject?: boolean
  
  allowThrowingAny?: boolean
  
  allowThrowingUnknown?: boolean
}]
// ----- @typescript-eslint/prefer-readonly -----
type TypescriptEslintPreferReadonly = []|[{
  
  onlyInlineLambdas?: boolean
}]
// ----- @typescript-eslint/prefer-readonly-parameter-types -----
type TypescriptEslintPreferReadonlyParameterTypes = []|[{
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
  
  checkParameterProperties?: boolean
  
  ignoreInferredTypes?: boolean
  
  treatMethodsAsReadonly?: boolean
}]
// ----- @typescript-eslint/prefer-string-starts-ends-with -----
type TypescriptEslintPreferStringStartsEndsWith = []|[{
  
  allowSingleElementEquality?: ("always" | "never")
}]
// ----- @typescript-eslint/promise-function-async -----
type TypescriptEslintPromiseFunctionAsync = []|[{
  
  allowAny?: boolean
  
  allowedPromiseNames?: string[]
  
  checkArrowFunctions?: boolean
  
  checkFunctionDeclarations?: boolean
  
  checkFunctionExpressions?: boolean
  
  checkMethodDeclarations?: boolean
}]
// ----- @typescript-eslint/require-array-sort-compare -----
type TypescriptEslintRequireArraySortCompare = []|[{
  
  ignoreStringArrays?: boolean
}]
// ----- @typescript-eslint/restrict-plus-operands -----
type TypescriptEslintRestrictPlusOperands = []|[{
  
  allowAny?: boolean
  
  allowBoolean?: boolean
  
  allowNullish?: boolean
  
  allowNumberAndString?: boolean
  
  allowRegExp?: boolean
  
  skipCompoundAssignments?: boolean
}]
// ----- @typescript-eslint/restrict-template-expressions -----
type TypescriptEslintRestrictTemplateExpressions = []|[{
  
  allowAny?: boolean
  
  allowArray?: boolean
  
  allowBoolean?: boolean
  
  allowNullish?: boolean
  
  allowNumber?: boolean
  
  allowRegExp?: boolean
  
  allowNever?: boolean
  
  allow?: (string | {
    from: "file"
    name: (string | [string, ...(string)[]])
    path?: string
  } | {
    from: "lib"
    name: (string | [string, ...(string)[]])
  } | {
    from: "package"
    name: (string | [string, ...(string)[]])
    package: string
  })[]
}]
// ----- @typescript-eslint/return-await -----
type TypescriptEslintReturnAwait = []|[(("always" | "error-handling-correctness-only" | "in-try-catch" | "never") & string)]
// ----- @typescript-eslint/sort-type-constituents -----
type TypescriptEslintSortTypeConstituents = []|[{
  
  caseSensitive?: boolean
  
  checkIntersections?: boolean
  
  checkUnions?: boolean
  
  groupOrder?: ("conditional" | "function" | "import" | "intersection" | "keyword" | "nullish" | "literal" | "named" | "object" | "operator" | "tuple" | "union")[]
}]
// ----- @typescript-eslint/strict-boolean-expressions -----
type TypescriptEslintStrictBooleanExpressions = []|[{
  
  allowAny?: boolean
  
  allowNullableBoolean?: boolean
  
  allowNullableEnum?: boolean
  
  allowNullableNumber?: boolean
  
  allowNullableObject?: boolean
  
  allowNullableString?: boolean
  
  allowNumber?: boolean
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
  
  allowString?: boolean
}]
// ----- @typescript-eslint/strict-void-return -----
type TypescriptEslintStrictVoidReturn = []|[{
  
  allowReturnAny?: boolean
}]
// ----- @typescript-eslint/switch-exhaustiveness-check -----
type TypescriptEslintSwitchExhaustivenessCheck = []|[{
  
  allowDefaultCaseForExhaustiveSwitch?: boolean
  
  considerDefaultExhaustiveForUnions?: boolean
  
  defaultCaseCommentPattern?: string
  
  requireDefaultForNonUnion?: boolean
}]
// ----- @typescript-eslint/triple-slash-reference -----
type TypescriptEslintTripleSlashReference = []|[{
  
  lib?: ("always" | "never")
  
  path?: ("always" | "never")
  
  types?: ("always" | "never" | "prefer-import")
}]
// ----- @typescript-eslint/typedef -----
type TypescriptEslintTypedef = []|[{
  
  arrayDestructuring?: boolean
  
  arrowParameter?: boolean
  
  memberVariableDeclaration?: boolean
  
  objectDestructuring?: boolean
  
  parameter?: boolean
  
  propertyDeclaration?: boolean
  
  variableDeclaration?: boolean
  
  variableDeclarationIgnoreFunction?: boolean
}]
// ----- @typescript-eslint/unbound-method -----
type TypescriptEslintUnboundMethod = []|[{
  
  ignoreStatic?: boolean
}]
// ----- @typescript-eslint/unified-signatures -----
type TypescriptEslintUnifiedSignatures = []|[{
  
  ignoreDifferentlyNamedParameters?: boolean
  
  ignoreOverloadsWithDifferentJSDoc?: boolean
}]
// ----- accessor-pairs -----
type AccessorPairs = []|[{
  getWithoutSet?: boolean
  setWithoutGet?: boolean
  enforceForClassMembers?: boolean
  enforceForTSTypes?: boolean
}]
// ----- array-bracket-newline -----
type ArrayBracketNewline = []|[(("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})]
// ----- array-bracket-spacing -----
type ArrayBracketSpacing = []|[("always" | "never")]|[("always" | "never"), {
  singleValue?: boolean
  objectsInArrays?: boolean
  arraysInArrays?: boolean
}]
// ----- array-callback-return -----
type ArrayCallbackReturn = []|[{
  allowImplicit?: boolean
  checkForEach?: boolean
  allowVoid?: boolean
}]
// ----- array-element-newline -----
type ArrayElementNewline = []|[(_ArrayElementNewlineBasicConfig | {
  ArrayExpression?: _ArrayElementNewlineBasicConfig
  ArrayPattern?: _ArrayElementNewlineBasicConfig
})]
type _ArrayElementNewlineBasicConfig = (("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})
// ----- arrow-body-style -----
type ArrowBodyStyle = ([]|[("always" | "never")] | []|["as-needed"]|["as-needed", {
  requireReturnForObjectLiteral?: boolean
}])
// ----- arrow-parens -----
type ArrowParens = []|[("always" | "as-needed")]|[("always" | "as-needed"), {
  requireForBlockBody?: boolean
}]
// ----- arrow-spacing -----
type ArrowSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- astro/jsx-a11y/alt-text -----
type AstroJsxA11YAltText = []|[{
  elements?: string[]
  img?: string[]
  object?: string[]
  area?: string[]
  "input[type=\"image\"]"?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/anchor-ambiguous-text -----
type AstroJsxA11YAnchorAmbiguousText = []|[{
  words?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/anchor-has-content -----
type AstroJsxA11YAnchorHasContent = []|[{
  components?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/anchor-is-valid -----
type AstroJsxA11YAnchorIsValid = []|[{
  components?: string[]
  specialLink?: string[]
  
  aspects?: [("noHref" | "invalidHref" | "preferButton"), ...(("noHref" | "invalidHref" | "preferButton"))[]]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/aria-role -----
type AstroJsxA11YAriaRole = []|[{
  allowedInvalidRoles?: string[]
  ignoreNonDOM?: boolean
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/autocomplete-valid -----
type AstroJsxA11YAutocompleteValid = []|[{
  inputComponents?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/control-has-associated-label -----
type AstroJsxA11YControlHasAssociatedLabel = []|[{
  labelAttributes?: string[]
  controlComponents?: string[]
  ignoreElements?: string[]
  ignoreRoles?: string[]
  
  depth?: number
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/heading-has-content -----
type AstroJsxA11YHeadingHasContent = []|[{
  components?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/img-redundant-alt -----
type AstroJsxA11YImgRedundantAlt = []|[{
  components?: string[]
  words?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/interactive-supports-focus -----
type AstroJsxA11YInteractiveSupportsFocus = []|[{
  
  tabbable?: ("button" | "checkbox" | "columnheader" | "combobox" | "grid" | "gridcell" | "link" | "listbox" | "menu" | "menubar" | "menuitem" | "menuitemcheckbox" | "menuitemradio" | "option" | "progressbar" | "radio" | "radiogroup" | "row" | "rowheader" | "scrollbar" | "searchbox" | "slider" | "spinbutton" | "switch" | "tab" | "tablist" | "textbox" | "tree" | "treegrid" | "treeitem" | "doc-backlink" | "doc-biblioref" | "doc-glossref" | "doc-noteref")[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/label-has-associated-control -----
type AstroJsxA11YLabelHasAssociatedControl = []|[{
  labelComponents?: string[]
  labelAttributes?: string[]
  controlComponents?: string[]
  
  assert?: ("htmlFor" | "nesting" | "both" | "either")
  
  depth?: number
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/media-has-caption -----
type AstroJsxA11YMediaHasCaption = []|[{
  audio?: string[]
  video?: string[]
  track?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/mouse-events-have-key-events -----
type AstroJsxA11YMouseEventsHaveKeyEvents = []|[{
  
  hoverInHandlers?: string[]
  
  hoverOutHandlers?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/no-autofocus -----
type AstroJsxA11YNoAutofocus = []|[{
  ignoreNonDOM?: boolean
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/no-distracting-elements -----
type AstroJsxA11YNoDistractingElements = []|[{
  
  elements?: ("marquee" | "blink")[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/no-interactive-element-to-noninteractive-role -----
type AstroJsxA11YNoInteractiveElementToNoninteractiveRole = []|[{
  [k: string]: string[] | undefined
}]
// ----- astro/jsx-a11y/no-noninteractive-element-interactions -----
type AstroJsxA11YNoNoninteractiveElementInteractions = []|[{
  handlers?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/no-noninteractive-element-to-interactive-role -----
type AstroJsxA11YNoNoninteractiveElementToInteractiveRole = []|[{
  [k: string]: string[] | undefined
}]
// ----- astro/jsx-a11y/no-noninteractive-tabindex -----
type AstroJsxA11YNoNoninteractiveTabindex = []|[{
  
  roles?: string[]
  
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/jsx-a11y/no-redundant-roles -----
type AstroJsxA11YNoRedundantRoles = []|[{
  [k: string]: string[] | undefined
}]
// ----- astro/jsx-a11y/no-static-element-interactions -----
type AstroJsxA11YNoStaticElementInteractions = []|[{
  handlers?: string[]
  [k: string]: unknown | undefined
}]
// ----- astro/no-unsafe-inline-scripts -----
type AstroNoUnsafeInlineScripts = []|[{
  allowDefineVars?: boolean
  allowModuleScripts?: boolean
  allowNonExecutingTypes?: string[]
  allowNonce?: boolean
}]
// ----- astro/prefer-split-class-list -----
type AstroPreferSplitClassList = []|[{
  splitLiteral?: boolean
}]
// ----- astro/semi -----
type AstroSemi = ([]|["never"]|["never", {
  beforeStatementContinuationChars?: ("always" | "any" | "never")
}] | []|["always"]|["always", {
  omitLastInOneLineBlock?: boolean
  omitLastInOneLineClassBody?: boolean
}])
// ----- astro/sort-attributes -----
type AstroSortAttributes = []|[{
  type?: ("alphabetical" | "line-length")
  ignoreCase?: boolean
  order?: ("asc" | "desc")
}]
// ----- better-tailwindcss/enforce-canonical-classes -----
type BetterTailwindcssEnforceCanonicalClasses = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  
  collapse?: boolean
  
  ignore?: string[]
  
  logical?: boolean
}]
// ----- better-tailwindcss/enforce-consistent-class-order -----
type BetterTailwindcssEnforceConsistentClassOrder = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  
  componentClassOrder?: ("asc" | "desc" | "preserve")
  
  componentClassPosition?: ("start" | "end")
  
  order?: ("asc" | "desc" | "official" | "strict")
  
  unknownClassOrder?: ("asc" | "desc" | "preserve")
  
  unknownClassPosition?: ("start" | "end")
}]
// ----- better-tailwindcss/enforce-consistent-important-position -----
type BetterTailwindcssEnforceConsistentImportantPosition = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  
  position?: ("legacy" | "recommended")
}]
// ----- better-tailwindcss/enforce-consistent-line-wrapping -----
type BetterTailwindcssEnforceConsistentLineWrapping = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  
  classesPerLine?: number
  
  group?: ("newLine" | "emptyLine" | "never")
  
  indent?: ("tab" | number)
  
  lineBreakStyle?: ("unix" | "windows")
  
  preferSingleLine?: boolean
  
  printWidth?: number
  
  strictness?: ("strict" | "loose")
  
  tabWidth?: number
  
  vueConvertToBinding?: boolean
}]
// ----- better-tailwindcss/enforce-consistent-variable-syntax -----
type BetterTailwindcssEnforceConsistentVariableSyntax = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  
  syntax?: ("shorthand" | "variable")
}]
// ----- better-tailwindcss/enforce-consistent-variant-order -----
type BetterTailwindcssEnforceConsistentVariantOrder = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
}]
// ----- better-tailwindcss/enforce-logical-properties -----
type BetterTailwindcssEnforceLogicalProperties = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  
  ignore?: string[]
}]
// ----- better-tailwindcss/enforce-shorthand-classes -----
type BetterTailwindcssEnforceShorthandClasses = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
}]
// ----- better-tailwindcss/no-concatenated-classes -----
type BetterTailwindcssNoConcatenatedClasses = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
}]
// ----- better-tailwindcss/no-conflicting-classes -----
type BetterTailwindcssNoConflictingClasses = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
}]
// ----- better-tailwindcss/no-deprecated-classes -----
type BetterTailwindcssNoDeprecatedClasses = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
}]
// ----- better-tailwindcss/no-duplicate-classes -----
type BetterTailwindcssNoDuplicateClasses = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
}]
// ----- better-tailwindcss/no-restricted-classes -----
type BetterTailwindcssNoRestrictedClasses = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  restrict?: ({
    
    fix?: string
    
    message?: string
    
    pattern: string
  } | string)[]
}]
// ----- better-tailwindcss/no-unknown-classes -----
type BetterTailwindcssNoUnknownClasses = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  
  ignore?: string[]
}]
// ----- better-tailwindcss/no-unnecessary-whitespace -----
type BetterTailwindcssNoUnnecessaryWhitespace = []|[{
  
  selectors?: ({
    
    kind: "attribute"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  } | ({
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  } | {
    
    callTarget?: ("all" | "first" | "last" | number)
    
    kind: "callee"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
    
    targetArgument?: ("all" | "first" | "last" | number)
    
    targetCall?: ("all" | "first" | "last" | number)
  }) | ({
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
    
    path?: string
  } | {
    
    kind: "tag"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name?: string
    
    path: string
  }) | {
    
    kind: "variable"
    
    match?: ({
      
      type: "strings"
    } | {
      
      path?: string
      
      type: "objectKeys"
    } | {
      
      path?: string
      
      type: "objectValues"
    } | {
      
      match: ({
        
        type: "strings"
      } | {
        
        path?: string
        
        type: "objectKeys"
      } | {
        
        path?: string
        
        type: "objectValues"
      })[]
      
      type: "anonymousFunctionReturn"
    })[]
    
    name: string
  })[]
  
  callees?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  attributes?: (string | [string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]])[]
  
  variables?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  tags?: ([string, ({
    
    match: "strings"
  } | {
    
    match: "objectKeys"
    
    pathPattern?: string
  } | {
    
    match: "objectValues"
    
    pathPattern?: string
  })[]] | string)[]
  
  entryPoint?: string
  
  messageStyle?: ("visual" | "compact" | "raw")
  
  tailwindConfig?: string
  
  tsconfig?: string
  
  detectComponentClasses?: boolean
  
  rootFontSize?: number
  
  cwd?: string
  
  allowMultiline?: boolean
}]
// ----- block-spacing -----
type BlockSpacing = []|[("always" | "never")]
// ----- brace-style -----
type BraceStyle = []|[("1tbs" | "stroustrup" | "allman")]|[("1tbs" | "stroustrup" | "allman"), {
  allowSingleLine?: boolean
}]
// ----- callback-return -----
type CallbackReturn = []|[string[]]
// ----- camelcase -----
type Camelcase = []|[{
  ignoreDestructuring?: boolean
  ignoreImports?: boolean
  ignoreGlobals?: boolean
  properties?: ("always" | "never")
  
  allow?: string[]
}]
// ----- capitalized-comments -----
type CapitalizedComments = []|[("always" | "never")]|[("always" | "never"), ({
  ignorePattern?: string
  ignoreInlineComments?: boolean
  ignoreConsecutiveComments?: boolean
} | {
  line?: {
    ignorePattern?: string
    ignoreInlineComments?: boolean
    ignoreConsecutiveComments?: boolean
  }
  block?: {
    ignorePattern?: string
    ignoreInlineComments?: boolean
    ignoreConsecutiveComments?: boolean
  }
})]
// ----- check-file/filename-blocklist -----
type CheckFileFilenameBlocklist = []|[{
  [k: string]: string | undefined
}]|[{
  [k: string]: string | undefined
}, {
  errorMessage?: string
}]
// ----- check-file/filename-naming-convention -----
type CheckFileFilenameNamingConvention = []|[{
  [k: string]: string | undefined
}]|[{
  [k: string]: string | undefined
}, {
  ignoreMiddleExtensions?: boolean
  errorMessage?: string
}]
// ----- check-file/folder-match-with-fex -----
type CheckFileFolderMatchWithFex = []|[{
  [k: string]: string | undefined
}]|[{
  [k: string]: string | undefined
}, {
  errorMessage?: string
}]
// ----- check-file/folder-naming-convention -----
type CheckFileFolderNamingConvention = []|[{
  [k: string]: string | undefined
}]|[{
  [k: string]: string | undefined
}, {
  errorMessage?: string
  ignoreWords?: string[]
}]
// ----- check-file/no-index -----
type CheckFileNoIndex = []|[{
  ignoreMiddleExtensions?: boolean
  errorMessage?: string
}]
// ----- class-methods-use-this -----
type ClassMethodsUseThis = []|[{
  exceptMethods?: string[]
  enforceForClassFields?: boolean
  ignoreOverrideMethods?: boolean
  ignoreClassesWithImplements?: ("all" | "public-fields")
}]
// ----- comma-dangle -----
type CommaDangle = []|[(_CommaDangleValue | {
  arrays?: _CommaDangleValueWithIgnore
  objects?: _CommaDangleValueWithIgnore
  imports?: _CommaDangleValueWithIgnore
  exports?: _CommaDangleValueWithIgnore
  functions?: _CommaDangleValueWithIgnore
})]
type _CommaDangleValue = ("always-multiline" | "always" | "never" | "only-multiline")
type _CommaDangleValueWithIgnore = ("always-multiline" | "always" | "ignore" | "never" | "only-multiline")
// ----- comma-spacing -----
type CommaSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- comma-style -----
type CommaStyle = []|[("first" | "last")]|[("first" | "last"), {
  exceptions?: {
    [k: string]: boolean | undefined
  }
}]
// ----- complexity -----
type Complexity = []|[(number | {
  maximum?: number
  max?: number
  variant?: ("classic" | "modified")
})]
// ----- computed-property-spacing -----
type ComputedPropertySpacing = []|[("always" | "never")]|[("always" | "never"), {
  enforceForClassMembers?: boolean
}]
// ----- consistent-return -----
type ConsistentReturn = []|[{
  treatUndefinedAsUnspecified?: boolean
}]
// ----- consistent-this -----
type ConsistentThis = string[]
// ----- curly -----
type Curly = ([]|["all"] | []|[("multi" | "multi-line" | "multi-or-nest")]|[("multi" | "multi-line" | "multi-or-nest"), "consistent"])
// ----- default-case -----
type DefaultCase = []|[{
  commentPattern?: string
}]
// ----- dot-location -----
type DotLocation = []|[("object" | "property")]
// ----- dot-notation -----
type DotNotation = []|[{
  allowKeywords?: boolean
  allowPattern?: string
}]
// ----- eol-last -----
type EolLast = []|[("always" | "never" | "unix" | "windows")]
// ----- eqeqeq -----
type Eqeqeq = ([]|["always"]|["always", {
  null?: ("always" | "never" | "ignore")
}] | []|[("smart" | "allow-null")])
// ----- func-call-spacing -----
type FuncCallSpacing = ([]|["never"] | []|["always"]|["always", {
  allowNewlines?: boolean
}])
// ----- func-name-matching -----
type FuncNameMatching = ([]|[("always" | "never")]|[("always" | "never"), {
  considerPropertyDescriptor?: boolean
  includeCommonJSModuleExports?: boolean
}] | []|[{
  considerPropertyDescriptor?: boolean
  includeCommonJSModuleExports?: boolean
}])
// ----- func-names -----
type FuncNames = []|[_FuncNamesValue]|[_FuncNamesValue, {
  generators?: _FuncNamesValue
}]
type _FuncNamesValue = ("always" | "as-needed" | "never")
// ----- func-style -----
type FuncStyle = []|[("declaration" | "expression")]|[("declaration" | "expression"), {
  allowArrowFunctions?: boolean
  allowTypeAnnotation?: boolean
  overrides?: {
    namedExports?: ("declaration" | "expression" | "ignore")
  }
}]
// ----- function-call-argument-newline -----
type FunctionCallArgumentNewline = []|[("always" | "never" | "consistent")]
// ----- function-paren-newline -----
type FunctionParenNewline = []|[(("always" | "never" | "consistent" | "multiline" | "multiline-arguments") | {
  minItems?: number
})]
// ----- generator-star-spacing -----
type GeneratorStarSpacing = []|[(("before" | "after" | "both" | "neither") | {
  before?: boolean
  after?: boolean
  named?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  anonymous?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
  method?: (("before" | "after" | "both" | "neither") | {
    before?: boolean
    after?: boolean
  })
})]
// ----- getter-return -----
type GetterReturn = []|[{
  allowImplicit?: boolean
}]
// ----- grouped-accessor-pairs -----
type GroupedAccessorPairs = []|[("anyOrder" | "getBeforeSet" | "setBeforeGet")]|[("anyOrder" | "getBeforeSet" | "setBeforeGet"), {
  enforceForTSTypes?: boolean
}]
// ----- handle-callback-err -----
type HandleCallbackErr = []|[string]
// ----- id-blacklist -----
type IdBlacklist = string[]
// ----- id-denylist -----
type IdDenylist = string[]
// ----- id-length -----
type IdLength = []|[{
  min?: number
  max?: number
  exceptions?: string[]
  exceptionPatterns?: string[]
  properties?: ("always" | "never")
}]
// ----- id-match -----
type IdMatch = []|[string]|[string, {
  properties?: boolean
  classFields?: boolean
  onlyDeclarations?: boolean
  ignoreDestructuring?: boolean
}]
// ----- implicit-arrow-linebreak -----
type ImplicitArrowLinebreak = []|[("beside" | "below")]
// ----- import-x/consistent-type-specifier-style -----
type ImportXConsistentTypeSpecifierStyle = []|[("prefer-top-level" | "prefer-inline")]
// ----- import-x/dynamic-import-chunkname -----
type ImportXDynamicImportChunkname = []|[{
  importFunctions?: string[]
  allowEmpty?: boolean
  webpackChunknameFormat?: string
  [k: string]: unknown | undefined
}]
// ----- import-x/extensions -----
type ImportXExtensions = ([]|[("always" | "ignorePackages" | "never")] | []|[("always" | "ignorePackages" | "never")]|[("always" | "ignorePackages" | "never"), {
  pattern?: {
    [k: string]: ("always" | "ignorePackages" | "never")
  }
  ignorePackages?: boolean
  checkTypeImports?: boolean
  pathGroupOverrides?: {
    pattern: string
    patternOptions?: {
      [k: string]: unknown | undefined
    }
    action: ("enforce" | "ignore")
  }[]
  fix?: boolean
  [k: string]: unknown | undefined
}] | []|[{
  pattern?: {
    [k: string]: ("always" | "ignorePackages" | "never")
  }
  ignorePackages?: boolean
  checkTypeImports?: boolean
  pathGroupOverrides?: {
    pattern: string
    patternOptions?: {
      [k: string]: unknown | undefined
    }
    action: ("enforce" | "ignore")
  }[]
  fix?: boolean
  [k: string]: unknown | undefined
}] | []|[("always" | "ignorePackages" | "never")]|[("always" | "ignorePackages" | "never"), {
  [k: string]: ("always" | "ignorePackages" | "never")
}] | []|[{
  [k: string]: ("always" | "ignorePackages" | "never")
}])
// ----- import-x/first -----
type ImportXFirst = []|[("absolute-first" | "disable-absolute-first")]
// ----- import-x/imports-first -----
type ImportXImportsFirst = []|[("absolute-first" | "disable-absolute-first")]
// ----- import-x/max-dependencies -----
type ImportXMaxDependencies = []|[{
  max?: number
  ignoreTypeImports?: boolean
}]
// ----- import-x/named -----
type ImportXNamed = []|[{
  commonjs?: boolean
}]
// ----- import-x/namespace -----
type ImportXNamespace = []|[{
  
  allowComputed?: boolean
}]
// ----- import-x/newline-after-import -----
type ImportXNewlineAfterImport = []|[{
  count?: number
  exactCount?: boolean
  considerComments?: boolean
}]
// ----- import-x/no-absolute-path -----
type ImportXNoAbsolutePath = []|[{
  commonjs?: boolean
  amd?: boolean
  esmodule?: boolean
  
  ignore?: [unknown, ...(unknown)[]]
}]
// ----- import-x/no-anonymous-default-export -----
type ImportXNoAnonymousDefaultExport = []|[{
  
  allowArray?: boolean
  
  allowArrowFunction?: boolean
  
  allowCallExpression?: boolean
  
  allowAnonymousClass?: boolean
  
  allowAnonymousFunction?: boolean
  
  allowLiteral?: boolean
  
  allowObject?: boolean
  
  allowNew?: boolean
}]
// ----- import-x/no-commonjs -----
type ImportXNoCommonjs = ([]|["allow-primitive-modules"] | []|[{
  allowPrimitiveModules?: boolean
  allowRequire?: boolean
  allowConditionalRequire?: boolean
}])
// ----- import-x/no-cycle -----
type ImportXNoCycle = []|[{
  commonjs?: boolean
  amd?: boolean
  esmodule?: boolean
  
  ignore?: [unknown, ...(unknown)[]]
  maxDepth?: (number | "∞")
  
  ignoreExternal?: boolean
  
  allowUnsafeDynamicCyclicDependency?: boolean
}]
// ----- import-x/no-duplicates -----
type ImportXNoDuplicates = []|[{
  considerQueryString?: boolean
  "prefer-inline"?: boolean
}]
// ----- import-x/no-dynamic-require -----
type ImportXNoDynamicRequire = []|[{
  esmodule?: boolean
}]
// ----- import-x/no-extraneous-dependencies -----
type ImportXNoExtraneousDependencies = []|[{
  devDependencies?: (boolean | unknown[])
  optionalDependencies?: (boolean | unknown[])
  peerDependencies?: (boolean | unknown[])
  bundledDependencies?: (boolean | unknown[])
  packageDir?: (string | unknown[])
  includeInternal?: boolean
  includeTypes?: boolean
  whitelist?: unknown[]
}]
// ----- import-x/no-import-module-exports -----
type ImportXNoImportModuleExports = []|[{
  exceptions?: unknown[]
}]
// ----- import-x/no-internal-modules -----
type ImportXNoInternalModules = []|[({
  allow?: string[]
} | {
  forbid?: string[]
})]
// ----- import-x/no-namespace -----
type ImportXNoNamespace = []|[{
  ignore?: string[]
  [k: string]: unknown | undefined
}]
// ----- import-x/no-nodejs-modules -----
type ImportXNoNodejsModules = []|[{
  allow?: string[]
}]
// ----- import-x/no-relative-packages -----
type ImportXNoRelativePackages = []|[{
  commonjs?: boolean
  amd?: boolean
  esmodule?: boolean
  
  ignore?: [unknown, ...(unknown)[]]
}]
// ----- import-x/no-relative-parent-imports -----
type ImportXNoRelativeParentImports = []|[{
  commonjs?: boolean
  amd?: boolean
  esmodule?: boolean
  
  ignore?: [unknown, ...(unknown)[]]
}]
// ----- import-x/no-rename-default -----
type ImportXNoRenameDefault = []|[{
  commonjs?: boolean
  preventRenamingBindings?: boolean
}]
// ----- import-x/no-restricted-paths -----
type ImportXNoRestrictedPaths = []|[{
  
  zones?: [{
    target?: (string | [string, ...(string)[]])
    from?: (string | [string, ...(string)[]])
    except?: string[]
    message?: string
  }, ...({
    target?: (string | [string, ...(string)[]])
    from?: (string | [string, ...(string)[]])
    except?: string[]
    message?: string
  })[]]
  basePath?: string
}]
// ----- import-x/no-unassigned-import -----
type ImportXNoUnassignedImport = []|[{
  devDependencies?: (boolean | unknown[])
  optionalDependencies?: (boolean | unknown[])
  peerDependencies?: (boolean | unknown[])
  allow?: string[]
}]
// ----- import-x/no-unresolved -----
type ImportXNoUnresolved = []|[{
  commonjs?: boolean
  amd?: boolean
  esmodule?: boolean
  
  ignore?: [unknown, ...(unknown)[]]
  caseSensitive?: boolean
  caseSensitiveStrict?: boolean
}]
// ----- import-x/no-unused-modules -----
type ImportXNoUnusedModules = []|[({
  unusedExports: true
  
  src?: [unknown, ...(unknown)[]]
  [k: string]: unknown | undefined
} | {
  missingExports: true
  [k: string]: unknown | undefined
})]
// ----- import-x/no-useless-path-segments -----
type ImportXNoUselessPathSegments = []|[{
  commonjs?: boolean
  noUselessIndex?: boolean
}]
// ----- import-x/order -----
type ImportXOrder = []|[{
  groups?: unknown[]
  pathGroupsExcludedImportTypes?: unknown[]
  distinctGroup?: boolean
  pathGroups?: {
    pattern: string
    patternOptions?: {
      [k: string]: unknown | undefined
    }
    group: ("builtin" | "external" | "internal" | "unknown" | "parent" | "sibling" | "index" | "object" | "type")
    position?: ("after" | "before")
  }[]
  "newlines-between"?: ("ignore" | "always" | "always-and-inside-groups" | "never")
  "newlines-between-types"?: ("ignore" | "always" | "always-and-inside-groups" | "never")
  consolidateIslands?: ("inside-groups" | "never")
  sortTypesGroup?: boolean
  named?: (boolean | {
    enabled?: boolean
    import?: boolean
    export?: boolean
    require?: boolean
    cjsExports?: boolean
    types?: ("mixed" | "types-first" | "types-last")
  })
  alphabetize?: {
    caseInsensitive?: boolean
    order?: ("ignore" | "asc" | "desc")
    orderImportKind?: ("ignore" | "asc" | "desc")
  }
  warnOnUnassignedImports?: boolean
}]
// ----- import-x/prefer-default-export -----
type ImportXPreferDefaultExport = []|[{
  target?: ("single" | "any")
}]
// ----- import-x/prefer-namespace-import -----
type ImportXPreferNamespaceImport = []|[{
  patterns?: string[]
}]
// ----- indent -----
type Indent = []|[("tab" | number)]|[("tab" | number), {
  SwitchCase?: number
  VariableDeclarator?: ((number | ("first" | "off")) | {
    var?: (number | ("first" | "off"))
    let?: (number | ("first" | "off"))
    const?: (number | ("first" | "off"))
  })
  outerIIFEBody?: (number | "off")
  MemberExpression?: (number | "off")
  FunctionDeclaration?: {
    parameters?: (number | ("first" | "off"))
    body?: number
  }
  FunctionExpression?: {
    parameters?: (number | ("first" | "off"))
    body?: number
  }
  StaticBlock?: {
    body?: number
  }
  CallExpression?: {
    arguments?: (number | ("first" | "off"))
  }
  ArrayExpression?: (number | ("first" | "off"))
  ObjectExpression?: (number | ("first" | "off"))
  ImportDeclaration?: (number | ("first" | "off"))
  flatTernaryExpressions?: boolean
  offsetTernaryExpressions?: boolean
  ignoredNodes?: string[]
  ignoreComments?: boolean
}]
// ----- indent-legacy -----
type IndentLegacy = []|[("tab" | number)]|[("tab" | number), {
  SwitchCase?: number
  VariableDeclarator?: (number | {
    var?: number
    let?: number
    const?: number
    [k: string]: unknown | undefined
  })
  outerIIFEBody?: number
  MemberExpression?: number
  FunctionDeclaration?: {
    parameters?: (number | "first")
    body?: number
    [k: string]: unknown | undefined
  }
  FunctionExpression?: {
    parameters?: (number | "first")
    body?: number
    [k: string]: unknown | undefined
  }
  CallExpression?: {
    parameters?: (number | "first")
    [k: string]: unknown | undefined
  }
  ArrayExpression?: (number | "first")
  ObjectExpression?: (number | "first")
}]
// ----- init-declarations -----
type InitDeclarations = ([]|["always"] | []|["never"]|["never", {
  ignoreForLoopInit?: boolean
}])
// ----- jest/consistent-test-it -----
type JestConsistentTestIt = []|[{
  fn?: ("it" | "test")
  withinDescribe?: ("it" | "test")
}]
// ----- jest/expect-expect -----
type JestExpectExpect = []|[{
  assertFunctionNames?: string[]
  additionalTestBlockFunctions?: string[]
}]
// ----- jest/max-expects -----
type JestMaxExpects = []|[{
  max?: number
}]
// ----- jest/max-nested-describe -----
type JestMaxNestedDescribe = []|[{
  max?: number
}]
// ----- jest/no-conditional-in-test -----
type JestNoConditionalInTest = []|[{
  allowOptionalChaining?: boolean
}]
// ----- jest/no-hooks -----
type JestNoHooks = []|[{
  allow?: unknown[]
}]
// ----- jest/no-large-snapshots -----
type JestNoLargeSnapshots = []|[{
  maxSize?: number
  inlineMaxSize?: number
  allowedSnapshots?: {
    [k: string]: unknown[] | undefined
  }
}]
// ----- jest/no-restricted-jest-methods -----
type JestNoRestrictedJestMethods = []|[{
  [k: string]: (string | null) | undefined
}]
// ----- jest/no-restricted-matchers -----
type JestNoRestrictedMatchers = []|[{
  [k: string]: (string | null) | undefined
}]
// ----- jest/no-standalone-expect -----
type JestNoStandaloneExpect = []|[{
  additionalTestBlockFunctions?: string[]
}]
// ----- jest/prefer-ending-with-an-expect -----
type JestPreferEndingWithAnExpect = []|[{
  assertFunctionNames?: string[]
  additionalTestBlockFunctions?: string[]
}]
// ----- jest/prefer-expect-assertions -----
type JestPreferExpectAssertions = []|[{
  onlyFunctionsWithAsyncKeyword?: boolean
  onlyFunctionsWithExpectInLoop?: boolean
  onlyFunctionsWithExpectInCallback?: boolean
}]
// ----- jest/prefer-importing-jest-globals -----
type JestPreferImportingJestGlobals = []|[{
  types?: ("hook" | "describe" | "test" | "expect" | "jest" | "unknown")[]
}]
// ----- jest/prefer-lowercase-title -----
type JestPreferLowercaseTitle = []|[{
  ignore?: ("describe" | "test" | "it")[]
  allowedPrefixes?: string[]
  ignoreTopLevelDescribe?: boolean
  ignoreTodos?: boolean
}]
// ----- jest/prefer-snapshot-hint -----
type JestPreferSnapshotHint = []|[("always" | "multi")]
// ----- jest/require-hook -----
type JestRequireHook = []|[{
  allowedFunctionCalls?: string[]
}]
// ----- jest/require-top-level-describe -----
type JestRequireTopLevelDescribe = []|[{
  maxNumberOfTopLevelDescribes?: number
}]
// ----- jest/unbound-method -----
type JestUnboundMethod = []|[{
  
  ignoreStatic?: boolean
}]
// ----- jest/valid-expect -----
type JestValidExpect = []|[{
  alwaysAwait?: boolean
  asyncMatchers?: string[]
  minArgs?: number
  maxArgs?: number
}]
// ----- jest/valid-expect-with-promise -----
type JestValidExpectWithPromise = []|[{
  checkThenables?: boolean
}]
// ----- jest/valid-mock-module-path -----
type JestValidMockModulePath = []|[{
  moduleFileExtensions?: string[]
}]
// ----- jest/valid-title -----
type JestValidTitle = []|[{
  ignoreSpaces?: boolean
  ignoreTypeOfDescribeName?: boolean
  ignoreTypeOfTestName?: boolean
  disallowedWords?: string[]
  [k: string]: (string | [string]|[string, string] | {
    [k: string]: (string | [string]|[string, string]) | undefined
  })
}]
// ----- jsx-a11y-x/alt-text -----
type JsxA11YXAltText = []|[{
  elements?: string[]
  img?: string[]
  object?: string[]
  area?: string[]
  "input[type=\"image\"]"?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/anchor-ambiguous-text -----
type JsxA11YXAnchorAmbiguousText = []|[{
  words?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/anchor-has-content -----
type JsxA11YXAnchorHasContent = []|[{
  components?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/anchor-is-valid -----
type JsxA11YXAnchorIsValid = []|[{
  components?: string[]
  specialLink?: string[]
  
  aspects?: [("noHref" | "invalidHref" | "preferButton"), ...(("noHref" | "invalidHref" | "preferButton"))[]]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/aria-role -----
type JsxA11YXAriaRole = []|[{
  allowedInvalidRoles?: string[]
  ignoreNonDOM?: boolean
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/autocomplete-valid -----
type JsxA11YXAutocompleteValid = []|[{
  inputComponents?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/control-has-associated-label -----
type JsxA11YXControlHasAssociatedLabel = []|[{
  labelAttributes?: string[]
  controlComponents?: string[]
  ignoreElements?: string[]
  ignoreRoles?: string[]
  
  depth?: number
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/heading-has-content -----
type JsxA11YXHeadingHasContent = []|[{
  components?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/img-redundant-alt -----
type JsxA11YXImgRedundantAlt = []|[{
  components?: string[]
  words?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/interactive-supports-focus -----
type JsxA11YXInteractiveSupportsFocus = []|[{
  
  tabbable?: ("button" | "checkbox" | "columnheader" | "combobox" | "grid" | "gridcell" | "link" | "listbox" | "menu" | "menubar" | "menuitem" | "menuitemcheckbox" | "menuitemradio" | "option" | "progressbar" | "radio" | "radiogroup" | "row" | "rowheader" | "scrollbar" | "searchbox" | "slider" | "spinbutton" | "switch" | "tab" | "tablist" | "textbox" | "tree" | "treegrid" | "treeitem" | "doc-backlink" | "doc-biblioref" | "doc-glossref" | "doc-noteref")[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/label-has-associated-control -----
type JsxA11YXLabelHasAssociatedControl = []|[{
  labelComponents?: string[]
  labelAttributes?: string[]
  controlComponents?: string[]
  
  assert?: ("htmlFor" | "nesting" | "both" | "either")
  
  depth?: number
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/media-has-caption -----
type JsxA11YXMediaHasCaption = []|[{
  audio?: string[]
  video?: string[]
  track?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/mouse-events-have-key-events -----
type JsxA11YXMouseEventsHaveKeyEvents = []|[{
  
  hoverInHandlers?: string[]
  
  hoverOutHandlers?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/no-autofocus -----
type JsxA11YXNoAutofocus = []|[{
  ignoreNonDOM?: boolean
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/no-distracting-elements -----
type JsxA11YXNoDistractingElements = []|[{
  
  elements?: ("marquee" | "blink")[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/no-interactive-element-to-noninteractive-role -----
type JsxA11YXNoInteractiveElementToNoninteractiveRole = []|[{
  [k: string]: string[] | undefined
}]
// ----- jsx-a11y-x/no-noninteractive-element-interactions -----
type JsxA11YXNoNoninteractiveElementInteractions = []|[{
  handlers?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/no-noninteractive-element-to-interactive-role -----
type JsxA11YXNoNoninteractiveElementToInteractiveRole = []|[{
  [k: string]: string[] | undefined
}]
// ----- jsx-a11y-x/no-noninteractive-tabindex -----
type JsxA11YXNoNoninteractiveTabindex = []|[{
  
  roles?: string[]
  
  tags?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-a11y-x/no-redundant-roles -----
type JsxA11YXNoRedundantRoles = []|[{
  [k: string]: string[] | undefined
}]
// ----- jsx-a11y-x/no-static-element-interactions -----
type JsxA11YXNoStaticElementInteractions = []|[{
  handlers?: string[]
  [k: string]: unknown | undefined
}]
// ----- jsx-quotes -----
type JsxQuotes = []|[("prefer-single" | "prefer-double")]
// ----- key-spacing -----
type KeySpacing = []|[({
  align?: (("colon" | "value") | {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  })
  mode?: ("strict" | "minimum")
  beforeColon?: boolean
  afterColon?: boolean
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    align?: (("colon" | "value") | {
      mode?: ("strict" | "minimum")
      on?: ("colon" | "value")
      beforeColon?: boolean
      afterColon?: boolean
    })
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  align?: {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  }
})]
// ----- keyword-spacing -----
type KeywordSpacing = []|[{
  before?: boolean
  after?: boolean
  overrides?: {
    abstract?: {
      before?: boolean
      after?: boolean
    }
    as?: {
      before?: boolean
      after?: boolean
    }
    async?: {
      before?: boolean
      after?: boolean
    }
    await?: {
      before?: boolean
      after?: boolean
    }
    boolean?: {
      before?: boolean
      after?: boolean
    }
    break?: {
      before?: boolean
      after?: boolean
    }
    byte?: {
      before?: boolean
      after?: boolean
    }
    case?: {
      before?: boolean
      after?: boolean
    }
    catch?: {
      before?: boolean
      after?: boolean
    }
    char?: {
      before?: boolean
      after?: boolean
    }
    class?: {
      before?: boolean
      after?: boolean
    }
    const?: {
      before?: boolean
      after?: boolean
    }
    continue?: {
      before?: boolean
      after?: boolean
    }
    debugger?: {
      before?: boolean
      after?: boolean
    }
    default?: {
      before?: boolean
      after?: boolean
    }
    delete?: {
      before?: boolean
      after?: boolean
    }
    do?: {
      before?: boolean
      after?: boolean
    }
    double?: {
      before?: boolean
      after?: boolean
    }
    else?: {
      before?: boolean
      after?: boolean
    }
    enum?: {
      before?: boolean
      after?: boolean
    }
    export?: {
      before?: boolean
      after?: boolean
    }
    extends?: {
      before?: boolean
      after?: boolean
    }
    false?: {
      before?: boolean
      after?: boolean
    }
    final?: {
      before?: boolean
      after?: boolean
    }
    finally?: {
      before?: boolean
      after?: boolean
    }
    float?: {
      before?: boolean
      after?: boolean
    }
    for?: {
      before?: boolean
      after?: boolean
    }
    from?: {
      before?: boolean
      after?: boolean
    }
    function?: {
      before?: boolean
      after?: boolean
    }
    get?: {
      before?: boolean
      after?: boolean
    }
    goto?: {
      before?: boolean
      after?: boolean
    }
    if?: {
      before?: boolean
      after?: boolean
    }
    implements?: {
      before?: boolean
      after?: boolean
    }
    import?: {
      before?: boolean
      after?: boolean
    }
    in?: {
      before?: boolean
      after?: boolean
    }
    instanceof?: {
      before?: boolean
      after?: boolean
    }
    int?: {
      before?: boolean
      after?: boolean
    }
    interface?: {
      before?: boolean
      after?: boolean
    }
    let?: {
      before?: boolean
      after?: boolean
    }
    long?: {
      before?: boolean
      after?: boolean
    }
    native?: {
      before?: boolean
      after?: boolean
    }
    new?: {
      before?: boolean
      after?: boolean
    }
    null?: {
      before?: boolean
      after?: boolean
    }
    of?: {
      before?: boolean
      after?: boolean
    }
    package?: {
      before?: boolean
      after?: boolean
    }
    private?: {
      before?: boolean
      after?: boolean
    }
    protected?: {
      before?: boolean
      after?: boolean
    }
    public?: {
      before?: boolean
      after?: boolean
    }
    return?: {
      before?: boolean
      after?: boolean
    }
    set?: {
      before?: boolean
      after?: boolean
    }
    short?: {
      before?: boolean
      after?: boolean
    }
    static?: {
      before?: boolean
      after?: boolean
    }
    super?: {
      before?: boolean
      after?: boolean
    }
    switch?: {
      before?: boolean
      after?: boolean
    }
    synchronized?: {
      before?: boolean
      after?: boolean
    }
    this?: {
      before?: boolean
      after?: boolean
    }
    throw?: {
      before?: boolean
      after?: boolean
    }
    throws?: {
      before?: boolean
      after?: boolean
    }
    transient?: {
      before?: boolean
      after?: boolean
    }
    true?: {
      before?: boolean
      after?: boolean
    }
    try?: {
      before?: boolean
      after?: boolean
    }
    typeof?: {
      before?: boolean
      after?: boolean
    }
    var?: {
      before?: boolean
      after?: boolean
    }
    void?: {
      before?: boolean
      after?: boolean
    }
    volatile?: {
      before?: boolean
      after?: boolean
    }
    while?: {
      before?: boolean
      after?: boolean
    }
    with?: {
      before?: boolean
      after?: boolean
    }
    yield?: {
      before?: boolean
      after?: boolean
    }
  }
}]
// ----- line-comment-position -----
type LineCommentPosition = []|[(("above" | "beside") | {
  position?: ("above" | "beside")
  ignorePattern?: string
  applyDefaultPatterns?: boolean
  applyDefaultIgnorePatterns?: boolean
})]
// ----- linebreak-style -----
type LinebreakStyle = []|[("unix" | "windows")]
// ----- lines-around-comment -----
type LinesAroundComment = []|[{
  beforeBlockComment?: boolean
  afterBlockComment?: boolean
  beforeLineComment?: boolean
  afterLineComment?: boolean
  allowBlockStart?: boolean
  allowBlockEnd?: boolean
  allowClassStart?: boolean
  allowClassEnd?: boolean
  allowObjectStart?: boolean
  allowObjectEnd?: boolean
  allowArrayStart?: boolean
  allowArrayEnd?: boolean
  ignorePattern?: string
  applyDefaultIgnorePatterns?: boolean
  afterHashbangComment?: boolean
}]
// ----- lines-around-directive -----
type LinesAroundDirective = []|[(("always" | "never") | {
  before?: ("always" | "never")
  after?: ("always" | "never")
})]
// ----- lines-between-class-members -----
type LinesBetweenClassMembers = []|[({
  
  enforce: [{
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  }, ...({
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  })[]]
} | ("always" | "never"))]|[({
  
  enforce: [{
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  }, ...({
    blankLine: ("always" | "never")
    prev: ("method" | "field" | "*")
    next: ("method" | "field" | "*")
  })[]]
} | ("always" | "never")), {
  exceptAfterSingleLine?: boolean
}]
// ----- logical-assignment-operators -----
type LogicalAssignmentOperators = (([]|["always"]|["always", {
  enforceForIfStatements?: boolean
}] | ["never"]) & unknown[])
// ----- max-classes-per-file -----
type MaxClassesPerFile = []|[(number | {
  ignoreExpressions?: boolean
  max?: number
})]
// ----- max-depth -----
type MaxDepth = []|[(number | {
  maximum?: number
  max?: number
})]
// ----- max-len -----
type MaxLen = []|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number)]|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), ({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number)]|[({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), ({
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
} | number), {
  code?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreStrings?: boolean
  ignoreUrls?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreTrailingComments?: boolean
}]
// ----- max-lines -----
type MaxLines = []|[(number | {
  max?: number
  skipComments?: boolean
  skipBlankLines?: boolean
})]
// ----- max-lines-per-function -----
type MaxLinesPerFunction = []|[({
  max?: number
  skipComments?: boolean
  skipBlankLines?: boolean
  IIFEs?: boolean
} | number)]
// ----- max-nested-callbacks -----
type MaxNestedCallbacks = []|[(number | {
  maximum?: number
  max?: number
  checkConstructorCallCallbacks?: boolean
})]
// ----- max-params -----
type MaxParams = []|[(number | {
  maximum?: number
  max?: number
  
  countVoidThis?: boolean
  
  countThis?: ("never" | "except-void" | "always")
})]
// ----- max-statements -----
type MaxStatements = []|[(number | {
  maximum?: number
  max?: number
})]|[(number | {
  maximum?: number
  max?: number
}), {
  ignoreTopLevelFunctions?: boolean
}]
// ----- max-statements-per-line -----
type MaxStatementsPerLine = []|[{
  max?: number
}]
// ----- multiline-comment-style -----
type MultilineCommentStyle = ([]|[("starred-block" | "bare-block")] | []|["separate-lines"]|["separate-lines", {
  checkJSDoc?: boolean
}])
// ----- multiline-ternary -----
type MultilineTernary = []|[("always" | "always-multiline" | "never")]
// ----- new-cap -----
type NewCap = []|[{
  newIsCap?: boolean
  capIsNew?: boolean
  newIsCapExceptions?: string[]
  newIsCapExceptionPattern?: string
  capIsNewExceptions?: string[]
  capIsNewExceptionPattern?: string
  properties?: boolean
}]
// ----- new-parens -----
type NewParens = []|[("always" | "never")]
// ----- newline-after-var -----
type NewlineAfterVar = []|[("never" | "always")]
// ----- newline-per-chained-call -----
type NewlinePerChainedCall = []|[{
  ignoreChainWithDepth?: number
}]
// ----- no-bitwise -----
type NoBitwise = []|[{
  allow?: ("^" | "|" | "&" | "<<" | ">>" | ">>>" | "^=" | "|=" | "&=" | "<<=" | ">>=" | ">>>=" | "~")[]
  int32Hint?: boolean
}]
// ----- no-cond-assign -----
type NoCondAssign = []|[("except-parens" | "always")]
// ----- no-confusing-arrow -----
type NoConfusingArrow = []|[{
  allowParens?: boolean
  onlyOneSimpleParam?: boolean
}]
// ----- no-console -----
type NoConsole = []|[{
  
  allow?: [string, ...(string)[]]
}]
// ----- no-constant-binary-expression -----
type NoConstantBinaryExpression = []|[{
  checkRelationalComparisons?: boolean
}]
// ----- no-constant-condition -----
type NoConstantCondition = []|[{
  checkLoops?: ("all" | "allExceptWhileTrue" | "none" | true | false)
}]
// ----- no-duplicate-imports -----
type NoDuplicateImports = []|[{
  includeExports?: boolean
  allowSeparateTypeImports?: boolean
}]
// ----- no-else-return -----
type NoElseReturn = []|[{
  allowElseIf?: boolean
}]
// ----- no-empty -----
type NoEmpty = []|[{
  allowEmptyCatch?: boolean
}]
// ----- no-empty-function -----
type NoEmptyFunction = []|[{
  allow?: ("functions" | "arrowFunctions" | "generatorFunctions" | "methods" | "generatorMethods" | "getters" | "setters" | "constructors" | "asyncFunctions" | "asyncMethods" | "privateConstructors" | "protectedConstructors" | "decoratedFunctions" | "overrideMethods")[]
}]
// ----- no-empty-pattern -----
type NoEmptyPattern = []|[{
  allowObjectPatternsAsParameters?: boolean
}]
// ----- no-eval -----
type NoEval = []|[{
  allowIndirect?: boolean
}]
// ----- no-extend-native -----
type NoExtendNative = []|[{
  exceptions?: string[]
}]
// ----- no-extra-boolean-cast -----
type NoExtraBooleanCast = []|[({
  enforceForInnerExpressions?: boolean
} | {
  enforceForLogicalOperands?: boolean
})]
// ----- no-extra-parens -----
type NoExtraParens = ([]|["functions"] | []|["all"]|["all", {
  conditionalAssign?: boolean
  ternaryOperandBinaryExpressions?: boolean
  nestedBinaryExpressions?: boolean
  returnAssign?: boolean
  ignoreJSX?: ("none" | "all" | "single-line" | "multi-line")
  enforceForArrowConditionals?: boolean
  enforceForSequenceExpressions?: boolean
  enforceForNewInMemberExpressions?: boolean
  enforceForFunctionPrototypeMethods?: boolean
  allowParensAfterCommentPattern?: string
}])
// ----- no-fallthrough -----
type NoFallthrough = []|[{
  commentPattern?: string
  allowEmptyCase?: boolean
  reportUnusedFallthroughComment?: boolean
}]
// ----- no-global-assign -----
type NoGlobalAssign = []|[{
  exceptions?: string[]
}]
// ----- no-implicit-coercion -----
type NoImplicitCoercion = []|[{
  boolean?: boolean
  number?: boolean
  string?: boolean
  disallowTemplateShorthand?: boolean
  allow?: ("~" | "!!" | "+" | "- -" | "-" | "*")[]
}]
// ----- no-implicit-globals -----
type NoImplicitGlobals = []|[{
  lexicalBindings?: boolean
}]
// ----- no-inline-comments -----
type NoInlineComments = []|[{
  ignorePattern?: string
}]
// ----- no-inner-declarations -----
type NoInnerDeclarations = []|[("functions" | "both")]|[("functions" | "both"), {
  blockScopedFunctions?: ("allow" | "disallow")
}]
// ----- no-invalid-regexp -----
type NoInvalidRegexp = []|[{
  allowConstructorFlags?: string[]
}]
// ----- no-invalid-this -----
type NoInvalidThis = []|[{
  capIsConstructor?: boolean
}]
// ----- no-irregular-whitespace -----
type NoIrregularWhitespace = []|[{
  skipComments?: boolean
  skipStrings?: boolean
  skipTemplates?: boolean
  skipRegExps?: boolean
  skipJSXText?: boolean
}]
// ----- no-labels -----
type NoLabels = []|[{
  allowLoop?: boolean
  allowSwitch?: boolean
}]
// ----- no-magic-numbers -----
type NoMagicNumbers = []|[{
  detectObjects?: boolean
  enforceConst?: boolean
  ignore?: (number | string)[]
  ignoreArrayIndexes?: boolean
  ignoreDefaultValues?: boolean
  ignoreClassFieldInitialValues?: boolean
  ignoreEnums?: boolean
  ignoreNumericLiteralTypes?: boolean
  ignoreReadonlyClassProperties?: boolean
  ignoreTypeIndexes?: boolean
}]
// ----- no-misleading-character-class -----
type NoMisleadingCharacterClass = []|[{
  allowEscape?: boolean
}]
// ----- no-mixed-operators -----
type NoMixedOperators = []|[{
  groups?: [("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"), ("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"), ...(("+" | "-" | "*" | "/" | "%" | "**" | "&" | "|" | "^" | "~" | "<<" | ">>" | ">>>" | "==" | "!=" | "===" | "!==" | ">" | ">=" | "<" | "<=" | "&&" | "||" | "in" | "instanceof" | "?:" | "??"))[]][]
  allowSamePrecedence?: boolean
}]
// ----- no-mixed-requires -----
type NoMixedRequires = []|[(boolean | {
  grouping?: boolean
  allowCall?: boolean
})]
// ----- no-mixed-spaces-and-tabs -----
type NoMixedSpacesAndTabs = []|[("smart-tabs" | true | false)]
// ----- no-multi-assign -----
type NoMultiAssign = []|[{
  ignoreNonDeclaration?: boolean
}]
// ----- no-multi-spaces -----
type NoMultiSpaces = []|[{
  exceptions?: {
    [k: string]: boolean
  }
  ignoreEOLComments?: boolean
}]
// ----- no-multiple-empty-lines -----
type NoMultipleEmptyLines = []|[{
  max: number
  maxEOF?: number
  maxBOF?: number
}]
// ----- no-native-reassign -----
type NoNativeReassign = []|[{
  exceptions?: string[]
}]
// ----- no-param-reassign -----
type NoParamReassign = []|[({
  props?: false
} | {
  props?: true
  ignorePropertyModificationsFor?: string[]
  ignorePropertyModificationsForRegex?: string[]
})]
// ----- no-plusplus -----
type NoPlusplus = []|[{
  allowForLoopAfterthoughts?: boolean
}]
// ----- no-promise-executor-return -----
type NoPromiseExecutorReturn = []|[{
  allowVoid?: boolean
}]
// ----- no-redeclare -----
type NoRedeclare = []|[{
  builtinGlobals?: boolean
}]
// ----- no-restricted-exports -----
type NoRestrictedExports = []|[({
  restrictedNamedExports?: string[]
  restrictedNamedExportsPattern?: string
} | {
  restrictedNamedExports?: string[]
  restrictedNamedExportsPattern?: string
  restrictDefaultExports?: {
    direct?: boolean
    named?: boolean
    defaultFrom?: boolean
    namedFrom?: boolean
    namespaceFrom?: boolean
  }
})]
// ----- no-restricted-globals -----
type NoRestrictedGlobals = ((string | {
  name: string
  message?: string
})[] | []|[{
  
  globals: (string | {
    name: string
    message?: string
  })[]
  checkGlobalObject?: boolean
  globalObjects?: string[]
}])
// ----- no-restricted-imports -----
type NoRestrictedImports = ((string | {
  name: string
  message?: string
  importNames?: string[]
  allowImportNames?: string[]
  
  allowTypeImports?: boolean
})[] | []|[{
  paths?: (string | {
    name: string
    message?: string
    importNames?: string[]
    allowImportNames?: string[]
    
    allowTypeImports?: boolean
  })[]
  patterns?: (string[] | ({
    [k: string]: unknown | undefined
  } | {
    [k: string]: unknown | undefined
  })[])
}])
// ----- no-restricted-modules -----
type NoRestrictedModules = ((string | {
  name: string
  message?: string
})[] | {
  paths?: (string | {
    name: string
    message?: string
  })[]
  patterns?: string[]
}[])
// ----- no-restricted-properties -----
type NoRestrictedProperties = ({
  [k: string]: unknown | undefined
} | {
  [k: string]: unknown | undefined
})[]
// ----- no-restricted-syntax -----
type NoRestrictedSyntax = (string | {
  selector: string
  message?: string
})[]
// ----- no-return-assign -----
type NoReturnAssign = []|[("except-parens" | "always")]
// ----- no-self-assign -----
type NoSelfAssign = []|[{
  props?: boolean
}]
// ----- no-sequences -----
type NoSequences = []|[{
  allowInParentheses?: boolean
}]
// ----- no-shadow -----
type NoShadow = []|[{
  builtinGlobals?: boolean
  hoist?: ("all" | "functions" | "never" | "types" | "functions-and-types")
  allow?: string[]
  ignoreOnInitialization?: boolean
  ignoreTypeValueShadow?: boolean
  ignoreFunctionTypeParameterNameValueShadow?: boolean
}]
// ----- no-shadow-restricted-names -----
type NoShadowRestrictedNames = []|[{
  reportGlobalThis?: boolean
}]
// ----- no-sync -----
type NoSync = []|[{
  allowAtRootLevel?: boolean
}]
// ----- no-tabs -----
type NoTabs = []|[{
  allowIndentationTabs?: boolean
}]
// ----- no-trailing-spaces -----
type NoTrailingSpaces = []|[{
  skipBlankLines?: boolean
  ignoreComments?: boolean
}]
// ----- no-undef -----
type NoUndef = []|[{
  typeof?: boolean
}]
// ----- no-underscore-dangle -----
type NoUnderscoreDangle = []|[{
  allow?: string[]
  allowAfterThis?: boolean
  allowAfterSuper?: boolean
  allowAfterThisConstructor?: boolean
  enforceInMethodNames?: boolean
  allowFunctionParams?: boolean
  enforceInClassFields?: boolean
  allowInArrayDestructuring?: boolean
  allowInObjectDestructuring?: boolean
}]
// ----- no-unmodified-loop-condition -----
type NoUnmodifiedLoopCondition = []|[{
  checkConditionalExpressions?: boolean
}]
// ----- no-unneeded-ternary -----
type NoUnneededTernary = []|[{
  defaultAssignment?: boolean
}]
// ----- no-unreachable-loop -----
type NoUnreachableLoop = []|[{
  ignore?: ("WhileStatement" | "DoWhileStatement" | "ForStatement" | "ForInStatement" | "ForOfStatement")[]
}]
// ----- no-unsafe-negation -----
type NoUnsafeNegation = []|[{
  enforceForOrderingRelations?: boolean
}]
// ----- no-unsafe-optional-chaining -----
type NoUnsafeOptionalChaining = []|[{
  disallowArithmeticOperators?: boolean
}]
// ----- no-unused-expressions -----
type NoUnusedExpressions = []|[{
  allowShortCircuit?: boolean
  allowTernary?: boolean
  allowTaggedTemplates?: boolean
  enforceForJSX?: boolean
  ignoreDirectives?: boolean
}]
// ----- no-unused-vars -----
type NoUnusedVars = []|[(("all" | "local") | {
  vars?: ("all" | "local")
  varsIgnorePattern?: string
  args?: ("all" | "after-used" | "none")
  ignoreRestSiblings?: boolean
  argsIgnorePattern?: string
  caughtErrors?: ("all" | "none")
  caughtErrorsIgnorePattern?: string
  destructuredArrayIgnorePattern?: string
  ignoreClassWithStaticInitBlock?: boolean
  ignoreUsingDeclarations?: boolean
  reportUsedIgnorePattern?: boolean
})]
// ----- no-use-before-define -----
type NoUseBeforeDefine = []|[("nofunc" | {
  functions?: boolean
  classes?: boolean
  variables?: boolean
  allowNamedExports?: boolean
  enums?: boolean
  typedefs?: boolean
  ignoreTypeReferences?: boolean
})]
// ----- no-useless-computed-key -----
type NoUselessComputedKey = []|[{
  enforceForClassMembers?: boolean
}]
// ----- no-useless-escape -----
type NoUselessEscape = []|[{
  allowRegexCharacters?: string[]
}]
// ----- no-useless-rename -----
type NoUselessRename = []|[{
  ignoreDestructuring?: boolean
  ignoreImport?: boolean
  ignoreExport?: boolean
}]
// ----- no-void -----
type NoVoid = []|[{
  allowAsStatement?: boolean
}]
// ----- no-warning-comments -----
type NoWarningComments = []|[{
  terms?: string[]
  location?: ("start" | "anywhere")
  
  decoration?: [string, ...(string)[]]
}]
// ----- nonblock-statement-body-position -----
type NonblockStatementBodyPosition = []|[("beside" | "below" | "any")]|[("beside" | "below" | "any"), {
  overrides?: {
    if?: ("beside" | "below" | "any")
    else?: ("beside" | "below" | "any")
    while?: ("beside" | "below" | "any")
    do?: ("beside" | "below" | "any")
    for?: ("beside" | "below" | "any")
  }
}]
// ----- object-curly-newline -----
type ObjectCurlyNewline = []|[((("always" | "never") | {
  multiline?: boolean
  minProperties?: number
  consistent?: boolean
}) | {
  ObjectExpression?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ObjectPattern?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ImportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ExportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
})]
// ----- object-curly-spacing -----
type ObjectCurlySpacing = []|[("always" | "never")]|[("always" | "never"), {
  arraysInObjects?: boolean
  objectsInObjects?: boolean
}]
// ----- object-property-newline -----
type ObjectPropertyNewline = []|[{
  allowAllPropertiesOnSameLine?: boolean
  allowMultiplePropertiesPerLine?: boolean
}]
// ----- object-shorthand -----
type ObjectShorthand = ([]|[("always" | "methods" | "properties" | "never" | "consistent" | "consistent-as-needed")] | []|[("always" | "methods" | "properties")]|[("always" | "methods" | "properties"), {
  avoidQuotes?: boolean
}] | []|[("always" | "methods")]|[("always" | "methods"), {
  ignoreConstructors?: boolean
  methodsIgnorePattern?: string
  avoidQuotes?: boolean
  avoidExplicitReturnArrows?: boolean
}])
// ----- one-var -----
type OneVar = []|[(("always" | "never" | "consecutive") | {
  separateRequires?: boolean
  var?: ("always" | "never" | "consecutive")
  let?: ("always" | "never" | "consecutive")
  const?: ("always" | "never" | "consecutive")
  using?: ("always" | "never" | "consecutive")
  awaitUsing?: ("always" | "never" | "consecutive")
} | {
  initialized?: ("always" | "never" | "consecutive")
  uninitialized?: ("always" | "never" | "consecutive")
})]
// ----- one-var-declaration-per-line -----
type OneVarDeclarationPerLine = []|[("always" | "initializations")]
// ----- operator-assignment -----
type OperatorAssignment = []|[("always" | "never")]
// ----- operator-linebreak -----
type OperatorLinebreak = []|[("after" | "before" | "none" | null)]|[("after" | "before" | "none" | null), {
  overrides?: {
    [k: string]: ("after" | "before" | "none" | "ignore") | undefined
  }
}]
// ----- padded-blocks -----
type PaddedBlocks = []|[(("always" | "never") | {
  blocks?: ("always" | "never")
  switches?: ("always" | "never")
  classes?: ("always" | "never")
})]|[(("always" | "never") | {
  blocks?: ("always" | "never")
  switches?: ("always" | "never")
  classes?: ("always" | "never")
}), {
  allowSingleLineBlocks?: boolean
}]
// ----- padding-line-between-statements -----
type _PaddingLineBetweenStatementsPaddingType = ("any" | "never" | "always")
type _PaddingLineBetweenStatementsStatementType = (("*" | "block-like" | "cjs-export" | "cjs-import" | "directive" | "expression" | "iife" | "multiline-block-like" | "multiline-expression" | "multiline-const" | "multiline-let" | "multiline-var" | "singleline-const" | "singleline-let" | "singleline-var" | "block" | "empty" | "function" | "break" | "case" | "class" | "const" | "continue" | "debugger" | "default" | "do" | "export" | "for" | "if" | "import" | "let" | "return" | "switch" | "throw" | "try" | "var" | "while" | "with") | [("*" | "block-like" | "cjs-export" | "cjs-import" | "directive" | "expression" | "iife" | "multiline-block-like" | "multiline-expression" | "multiline-const" | "multiline-let" | "multiline-var" | "singleline-const" | "singleline-let" | "singleline-var" | "block" | "empty" | "function" | "break" | "case" | "class" | "const" | "continue" | "debugger" | "default" | "do" | "export" | "for" | "if" | "import" | "let" | "return" | "switch" | "throw" | "try" | "var" | "while" | "with"), ...(("*" | "block-like" | "cjs-export" | "cjs-import" | "directive" | "expression" | "iife" | "multiline-block-like" | "multiline-expression" | "multiline-const" | "multiline-let" | "multiline-var" | "singleline-const" | "singleline-let" | "singleline-var" | "block" | "empty" | "function" | "break" | "case" | "class" | "const" | "continue" | "debugger" | "default" | "do" | "export" | "for" | "if" | "import" | "let" | "return" | "switch" | "throw" | "try" | "var" | "while" | "with"))[]])
type PaddingLineBetweenStatements = {
  blankLine: _PaddingLineBetweenStatementsPaddingType
  prev: _PaddingLineBetweenStatementsStatementType
  next: _PaddingLineBetweenStatementsStatementType
}[]
// ----- playwright/expect-expect -----
type PlaywrightExpectExpect = []|[{
  assertFunctionNames?: []|[string]
  assertFunctionPatterns?: []|[string]
}]
// ----- playwright/max-expects -----
type PlaywrightMaxExpects = []|[{
  max?: number
}]
// ----- playwright/max-nested-describe -----
type PlaywrightMaxNestedDescribe = []|[{
  max?: number
}]
// ----- playwright/missing-playwright-await -----
type PlaywrightMissingPlaywrightAwait = []|[{
  customMatchers?: string[]
  includePageLocatorMethods?: boolean
}]
// ----- playwright/no-action-timeout -----
type PlaywrightNoActionTimeout = []|[{
  allow?: string[]
}]
// ----- playwright/no-hooks -----
type PlaywrightNoHooks = []|[{
  allow?: ("beforeAll" | "beforeEach" | "afterAll" | "afterEach")[]
}]
// ----- playwright/no-magic-timeouts -----
type PlaywrightNoMagicTimeouts = []|[{
  allow?: number[]
  minOccurrences?: number
  properties?: string[]
}]
// ----- playwright/no-raw-locators -----
type PlaywrightNoRawLocators = []|[{
  allowed?: string[]
}]
// ----- playwright/no-restricted-locators -----
type PlaywrightNoRestrictedLocators = []|[(string | {
  message?: string
  type: string
})[]]
// ----- playwright/no-restricted-matchers -----
type PlaywrightNoRestrictedMatchers = []|[{
  [k: string]: (string | null) | undefined
}]
// ----- playwright/no-restricted-roles -----
type PlaywrightNoRestrictedRoles = []|[(string | {
  message?: string
  role: string
})[]]
// ----- playwright/no-skipped-test -----
type PlaywrightNoSkippedTest = []|[{
  allowConditional?: (boolean | {
    fixme?: boolean
    skip?: boolean
  })
  disallowFixme?: boolean
}]
// ----- playwright/no-slowed-test -----
type PlaywrightNoSlowedTest = []|[{
  allowConditional?: boolean
}]
// ----- playwright/no-template-literal-title -----
type PlaywrightNoTemplateLiteralTitle = []|[{
  ignore?: ("test" | "test.describe" | "test.step")[]
}]
// ----- playwright/prefer-ending-with-an-expect -----
type PlaywrightPreferEndingWithAnExpect = []|[{
  assertFunctionNames?: string[]
  assertFunctionPatterns?: string[]
}]
// ----- playwright/prefer-lowercase-title -----
type PlaywrightPreferLowercaseTitle = []|[{
  allowedPrefixes?: string[]
  ignore?: ("test.describe" | "test")[]
  ignoreTopLevelDescribe?: boolean
}]
// ----- playwright/prefer-native-locators -----
type PlaywrightPreferNativeLocators = []|[{
  testIdAttribute?: string
}]
// ----- playwright/require-annotation-reason -----
type PlaywrightRequireAnnotationReason = []|[{
  annotations?: ("fail" | "fixme" | "skip" | "slow")[]
  pattern?: string
}]
// ----- playwright/require-hook -----
type PlaywrightRequireHook = []|[{
  allowedFunctionCalls?: string[]
}]
// ----- playwright/require-top-level-describe -----
type PlaywrightRequireTopLevelDescribe = []|[{
  maxTopLevelDescribes?: number
}]
// ----- playwright/valid-expect -----
type PlaywrightValidExpect = []|[{
  maxArgs?: number
  minArgs?: number
}]
// ----- playwright/valid-test-tags -----
type PlaywrightValidTestTags = []|[{
  allowedTags?: (string | {
    source?: string
  })[]
  disallowedTags?: (string | {
    source?: string
  })[]
}]
// ----- playwright/valid-title -----
type PlaywrightValidTitle = []|[{
  disallowedWords?: string[]
  ignoreSpaces?: boolean
  ignoreTypeOfDescribeName?: boolean
  ignoreTypeOfStepName?: boolean
  ignoreTypeOfTestName?: boolean
  [k: string]: (string | [string]|[string, string] | {
    [k: string]: (string | [string]|[string, string]) | undefined
  })
}]
// ----- prefer-arrow-callback -----
type PreferArrowCallback = []|[{
  allowNamedFunctions?: boolean
  allowUnboundThis?: boolean
}]
// ----- prefer-const -----
type PreferConst = []|[{
  destructuring?: ("any" | "all")
  ignoreReadBeforeAssign?: boolean
}]
// ----- prefer-destructuring -----
type PreferDestructuring = []|[({
  VariableDeclarator?: {
    array?: boolean
    object?: boolean
  }
  AssignmentExpression?: {
    array?: boolean
    object?: boolean
  }
} | {
  array?: boolean
  object?: boolean
})]|[({
  VariableDeclarator?: {
    array?: boolean
    object?: boolean
  }
  AssignmentExpression?: {
    array?: boolean
    object?: boolean
  }
} | {
  array?: boolean
  object?: boolean
}), {
  enforceForRenamedProperties?: boolean
}]
// ----- prefer-promise-reject-errors -----
type PreferPromiseRejectErrors = []|[{
  allowEmptyReject?: boolean
}]
// ----- prefer-reflect -----
type PreferReflect = []|[{
  exceptions?: ("apply" | "call" | "delete" | "defineProperty" | "getOwnPropertyDescriptor" | "getPrototypeOf" | "setPrototypeOf" | "isExtensible" | "getOwnPropertyNames" | "preventExtensions")[]
}]
// ----- prefer-regex-literals -----
type PreferRegexLiterals = []|[{
  disallowRedundantWrapping?: boolean
}]
// ----- preserve-caught-error -----
type PreserveCaughtError = []|[{
  
  requireCatchParameter?: boolean
  
  errorClassNames?: (string | {
    name: string
    argumentPosition: number
  })[]
}]
// ----- quote-props -----
type QuoteProps = ([]|[("always" | "as-needed" | "consistent" | "consistent-as-needed")] | []|[("always" | "as-needed" | "consistent" | "consistent-as-needed")]|[("always" | "as-needed" | "consistent" | "consistent-as-needed"), {
  keywords?: boolean
  unnecessary?: boolean
  numbers?: boolean
}])
// ----- quotes -----
type Quotes = []|[("single" | "double" | "backtick")]|[("single" | "double" | "backtick"), ("avoid-escape" | {
  avoidEscape?: boolean
  allowTemplateLiterals?: boolean
})]
// ----- radix -----
type Radix = []|[("always" | "as-needed")]
// ----- react-hooks/capitalized-calls -----
type ReactHooksCapitalizedCalls = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/config -----
type ReactHooksConfig = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/error-boundaries -----
type ReactHooksErrorBoundaries = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/exhaustive-deps -----
type ReactHooksExhaustiveDeps = []|[{
  additionalHooks?: string
  enableDangerousAutofixThisMayCauseInfiniteLoops?: boolean
  experimental_autoDependenciesHooks?: string[]
  requireExplicitEffectDeps?: boolean
}]
// ----- react-hooks/exhaustive-effect-dependencies -----
type ReactHooksExhaustiveEffectDependencies = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/fbt -----
type ReactHooksFbt = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/gating -----
type ReactHooksGating = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/globals -----
type ReactHooksGlobals = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/hooks -----
type ReactHooksHooks = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/immutability -----
type ReactHooksImmutability = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/incompatible-library -----
type ReactHooksIncompatibleLibrary = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/invariant -----
type ReactHooksInvariant = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/memo-dependencies -----
type ReactHooksMemoDependencies = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/memoized-effect-dependencies -----
type ReactHooksMemoizedEffectDependencies = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/no-deriving-state-in-effects -----
type ReactHooksNoDerivingStateInEffects = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/preserve-manual-memoization -----
type ReactHooksPreserveManualMemoization = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/purity -----
type ReactHooksPurity = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/refs -----
type ReactHooksRefs = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/rule-suppression -----
type ReactHooksRuleSuppression = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/rules-of-hooks -----
type ReactHooksRulesOfHooks = []|[{
  additionalHooks?: string
}]
// ----- react-hooks/set-state-in-effect -----
type ReactHooksSetStateInEffect = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/set-state-in-render -----
type ReactHooksSetStateInRender = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/static-components -----
type ReactHooksStaticComponents = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/syntax -----
type ReactHooksSyntax = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/todo -----
type ReactHooksTodo = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/unsupported-syntax -----
type ReactHooksUnsupportedSyntax = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/use-memo -----
type ReactHooksUseMemo = []|[{
  [k: string]: unknown | undefined
}]
// ----- react-hooks/void-use-memo -----
type ReactHooksVoidUseMemo = []|[{
  [k: string]: unknown | undefined
}]
// ----- require-atomic-updates -----
type RequireAtomicUpdates = []|[{
  allowProperties?: boolean
}]
// ----- require-unicode-regexp -----
type RequireUnicodeRegexp = []|[{
  requireFlag?: ("u" | "v")
}]
// ----- rest-spread-spacing -----
type RestSpreadSpacing = []|[("always" | "never")]
// ----- semi -----
type Semi = ([]|["never"]|["never", {
  beforeStatementContinuationChars?: ("always" | "any" | "never")
}] | []|["always"]|["always", {
  omitLastInOneLineBlock?: boolean
  omitLastInOneLineClassBody?: boolean
}])
// ----- semi-spacing -----
type SemiSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- semi-style -----
type SemiStyle = []|[("last" | "first")]
// ----- simple-import-sort/imports -----
type SimpleImportSortImports = []|[{
  groups?: string[][]
}]
// ----- solid/event-handlers -----
type SolidEventHandlers = []|[{
  
  ignoreCase?: boolean
  
  warnOnSpread?: boolean
}]
// ----- solid/jsx-no-duplicate-props -----
type SolidJsxNoDuplicateProps = []|[{
  
  ignoreCase?: boolean
}]
// ----- solid/jsx-no-undef -----
type SolidJsxNoUndef = []|[{
  
  allowGlobals?: boolean
  
  autoImport?: boolean
  
  typescriptEnabled?: boolean
}]
// ----- solid/no-innerhtml -----
type SolidNoInnerhtml = []|[{
  
  allowStatic?: boolean
}]
// ----- solid/no-unknown-namespaces -----
type SolidNoUnknownNamespaces = []|[{
  
  allowedNamespaces?: [string, ...(string)[]]
}]
// ----- solid/prefer-classlist -----
type SolidPreferClasslist = []|[{
  
  classnames?: [string, ...(string)[]]
}]
// ----- solid/reactivity -----
type SolidReactivity = []|[{
  
  customReactiveFunctions?: string[]
}]
// ----- solid/self-closing-comp -----
type SolidSelfClosingComp = []|[{
  
  component?: ("all" | "none")
  
  html?: ("all" | "void" | "none")
}]
// ----- solid/style-prop -----
type SolidStyleProp = []|[{
  
  styleProps?: [string, ...(string)[]]
  
  allowString?: boolean
}]
// ----- solid/valid-use-server -----
type SolidValidUseServer = []|[{
  
  clientWrappers?: string[]
}]
// ----- sonarjs/arrow-function-convention -----
type SonarjsArrowFunctionConvention = []|[{
  requireParameterParentheses?: boolean
  requireBodyBraces?: boolean
}]
// ----- sonarjs/class-name -----
type SonarjsClassName = []|[{
  format?: string
}]
// ----- sonarjs/cognitive-complexity -----
type SonarjsCognitiveComplexity = []|[(number | "silence-issues")]|[(number | "silence-issues"), "silence-issues"]
// ----- sonarjs/comment-regex -----
type SonarjsCommentRegex = []|[{
  regularExpression?: string
  message?: string
  flags?: string
}]
// ----- sonarjs/content-length -----
type SonarjsContentLength = []|[{
  fileUploadSizeLimit?: number
  standardSizeLimit?: number
}]
// ----- sonarjs/cyclomatic-complexity -----
type SonarjsCyclomaticComplexity = []|[{
  threshold?: number
}]
// ----- sonarjs/expression-complexity -----
type SonarjsExpressionComplexity = []|[{
  max?: number
}]
// ----- sonarjs/file-header -----
type SonarjsFileHeader = []|[{
  headerFormat?: string
  isRegularExpression?: boolean
}]
// ----- sonarjs/function-name -----
type SonarjsFunctionName = []|[{
  format?: string
}]
// ----- sonarjs/max-lines -----
type SonarjsMaxLines = []|[{
  maximum?: number
}]
// ----- sonarjs/max-lines-per-function -----
type SonarjsMaxLinesPerFunction = []|[{
  maximum?: number
}]
// ----- sonarjs/max-switch-cases -----
type SonarjsMaxSwitchCases = []|[number]
// ----- sonarjs/max-union-size -----
type SonarjsMaxUnionSize = []|[{
  threshold?: number
}]
// ----- sonarjs/nested-control-flow -----
type SonarjsNestedControlFlow = []|[{
  maximumNestingLevel?: number
}]
// ----- sonarjs/new-operator-misuse -----
type SonarjsNewOperatorMisuse = []|[{
  considerJSDoc?: boolean
}]
// ----- sonarjs/no-duplicate-string -----
type SonarjsNoDuplicateString = []|[{
  threshold?: number
  ignoreStrings?: string
}]
// ----- sonarjs/no-hardcoded-passwords -----
type SonarjsNoHardcodedPasswords = []|[{
  passwordWords?: string[]
}]
// ----- sonarjs/no-hardcoded-secrets -----
type SonarjsNoHardcodedSecrets = []|[{
  secretWords?: string
  randomnessSensibility?: number
}]
// ----- sonarjs/no-identical-functions -----
type SonarjsNoIdenticalFunctions = []|[number]
// ----- sonarjs/no-implicit-dependencies -----
type SonarjsNoImplicitDependencies = []|[{
  whitelist?: string[]
}]
// ----- sonarjs/no-intrusive-permissions -----
type SonarjsNoIntrusivePermissions = []|[{
  permissions?: string[]
}]
// ----- sonarjs/no-nested-functions -----
type SonarjsNoNestedFunctions = []|[{
  threshold?: number
}]
// ----- sonarjs/regex-complexity -----
type SonarjsRegexComplexity = []|[{
  threshold?: number
}]
// ----- sonarjs/variable-name -----
type SonarjsVariableName = []|[{
  format?: string
}]
// ----- sort-imports -----
type SortImports = []|[{
  ignoreCase?: boolean
  
  memberSyntaxSortOrder?: [("none" | "all" | "multiple" | "single"), ("none" | "all" | "multiple" | "single"), ("none" | "all" | "multiple" | "single"), ("none" | "all" | "multiple" | "single")]
  ignoreDeclarationSort?: boolean
  ignoreMemberSort?: boolean
  allowSeparatedGroups?: boolean
}]
// ----- sort-keys -----
type SortKeys = []|[("asc" | "desc")]|[("asc" | "desc"), {
  caseSensitive?: boolean
  natural?: boolean
  minKeys?: number
  allowLineSeparatedGroups?: boolean
  ignoreComputedKeys?: boolean
}]
// ----- sort-vars -----
type SortVars = []|[{
  ignoreCase?: boolean
}]
// ----- space-before-blocks -----
type SpaceBeforeBlocks = []|[(("always" | "never") | {
  keywords?: ("always" | "never" | "off")
  functions?: ("always" | "never" | "off")
  classes?: ("always" | "never" | "off")
})]
// ----- space-before-function-paren -----
type SpaceBeforeFunctionParen = []|[(("always" | "never") | {
  anonymous?: ("always" | "never" | "ignore")
  named?: ("always" | "never" | "ignore")
  asyncArrow?: ("always" | "never" | "ignore")
})]
// ----- space-in-parens -----
type SpaceInParens = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: ("{}" | "[]" | "()" | "empty")[]
}]
// ----- space-infix-ops -----
type SpaceInfixOps = []|[{
  int32Hint?: boolean
}]
// ----- space-unary-ops -----
type SpaceUnaryOps = []|[{
  words?: boolean
  nonwords?: boolean
  overrides?: {
    [k: string]: boolean | undefined
  }
}]
// ----- spaced-comment -----
type SpacedComment = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: string[]
  markers?: string[]
  line?: {
    exceptions?: string[]
    markers?: string[]
  }
  block?: {
    exceptions?: string[]
    markers?: string[]
    balanced?: boolean
  }
}]
// ----- storybook/meta-inline-properties -----
type StorybookMetaInlineProperties = []|[{
  csfVersion?: number
}]
// ----- storybook/no-uninstalled-addons -----
type StorybookNoUninstalledAddons = []|[{
  packageJsonLocation?: string
  ignore?: string[]
}]
// ----- strict -----
type Strict = []|[("never" | "global" | "function" | "safe")]
// ----- svelte/@typescript-eslint/no-unnecessary-condition -----
type SvelteTypescriptEslintNoUnnecessaryCondition = []|[{
  
  allowConstantLoopConditions?: boolean
  
  allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing?: boolean
}]
// ----- svelte/block-lang -----
type SvelteBlockLang = []|[{
  enforceScriptPresent?: boolean
  enforceStylePresent?: boolean
  script?: ((string | null) | [(string | null), ...((string | null))[]])
  style?: ((string | null) | [(string | null), ...((string | null))[]])
}]
// ----- svelte/button-has-type -----
type SvelteButtonHasType = []|[{
  button?: boolean
  submit?: boolean
  reset?: boolean
}]
// ----- svelte/comment-directive -----
type SvelteCommentDirective = []|[{
  reportUnusedDisableDirectives?: boolean
}]
// ----- svelte/consistent-selector-style -----
type SvelteConsistentSelectorStyle = []|[{
  checkGlobal?: boolean
  
  style?: []|[("class" | "id" | "type")]|[("class" | "id" | "type"), ("class" | "id" | "type")]|[("class" | "id" | "type"), ("class" | "id" | "type"), ("class" | "id" | "type")]
}]
// ----- svelte/first-attribute-linebreak -----
type SvelteFirstAttributeLinebreak = []|[{
  multiline?: ("below" | "beside")
  singleline?: ("below" | "beside")
}]
// ----- svelte/html-closing-bracket-new-line -----
type SvelteHtmlClosingBracketNewLine = []|[{
  singleline?: ("always" | "never")
  multiline?: ("always" | "never")
  selfClosingTag?: {
    singleline?: ("always" | "never")
    multiline?: ("always" | "never")
  }
}]
// ----- svelte/html-closing-bracket-spacing -----
type SvelteHtmlClosingBracketSpacing = []|[{
  startTag?: ("always" | "never" | "ignore")
  endTag?: ("always" | "never" | "ignore")
  selfClosingTag?: ("always" | "never" | "ignore")
}]
// ----- svelte/html-quotes -----
type SvelteHtmlQuotes = []|[{
  prefer?: ("double" | "single")
  dynamic?: {
    quoted?: boolean
    avoidInvalidUnquotedInHTML?: boolean
  }
}]
// ----- svelte/html-self-closing -----
type SvelteHtmlSelfClosing = []|[({
  void?: ("never" | "always" | "ignore")
  normal?: ("never" | "always" | "ignore")
  svg?: ("never" | "always" | "ignore")
  math?: ("never" | "always" | "ignore")
  component?: ("never" | "always" | "ignore")
  svelte?: ("never" | "always" | "ignore")
} | ("all" | "html" | "none"))]
// ----- svelte/indent -----
type SvelteIndent = []|[{
  indent?: (number | "tab")
  indentScript?: boolean
  switchCase?: number
  alignAttributesVertically?: boolean
  ignoredNodes?: (string & {
    [k: string]: unknown | undefined
  } & {
    [k: string]: unknown | undefined
  })[]
}]
// ----- svelte/max-attributes-per-line -----
type SvelteMaxAttributesPerLine = []|[{
  multiline?: number
  singleline?: number
}]
// ----- svelte/max-lines-per-block -----
type SvelteMaxLinesPerBlock = []|[{
  script?: number
  template?: number
  style?: number
  skipBlankLines?: boolean
  skipComments?: boolean
}]
// ----- svelte/mustache-spacing -----
type SvelteMustacheSpacing = []|[{
  textExpressions?: ("never" | "always")
  attributesAndProps?: ("never" | "always")
  directiveExpressions?: ("never" | "always")
  tags?: {
    openingBrace?: ("never" | "always")
    closingBrace?: ("never" | "always" | "always-after-expression")
  }
}]
// ----- svelte/no-inline-styles -----
type SvelteNoInlineStyles = []|[{
  allowTransitions?: boolean
}]
// ----- svelte/no-inner-declarations -----
type SvelteNoInnerDeclarations = []|[("functions" | "both")]|[("functions" | "both"), {
  blockScopedFunctions?: ("allow" | "disallow")
}]
// ----- svelte/no-navigation-without-base -----
type SvelteNoNavigationWithoutBase = []|[{
  ignoreGoto?: boolean
  ignoreLinks?: boolean
  ignorePushState?: boolean
  ignoreReplaceState?: boolean
}]
// ----- svelte/no-navigation-without-resolve -----
type SvelteNoNavigationWithoutResolve = []|[{
  ignoreGoto?: boolean
  ignoreLinks?: boolean
  ignorePushState?: boolean
  ignoreReplaceState?: boolean
}]
// ----- svelte/no-reactive-reassign -----
type SvelteNoReactiveReassign = []|[{
  props?: boolean
}]
// ----- svelte/no-restricted-html-elements -----
type SvelteNoRestrictedHtmlElements = [(string | {
  
  elements?: [string, ...(string)[]]
  message?: string
}), ...((string | {
  
  elements?: [string, ...(string)[]]
  message?: string
}))[]]
// ----- svelte/no-target-blank -----
type SvelteNoTargetBlank = []|[{
  allowReferrer?: boolean
  enforceDynamicLinks?: ("always" | "never")
}]
// ----- svelte/no-trailing-spaces -----
type SvelteNoTrailingSpaces = []|[{
  skipBlankLines?: boolean
  ignoreComments?: boolean
}]
// ----- svelte/no-unknown-style-directive-property -----
type SvelteNoUnknownStyleDirectiveProperty = []|[{
  
  ignoreProperties?: [string, ...(string)[]]
  ignorePrefixed?: boolean
}]
// ----- svelte/no-unnecessary-state-wrap -----
type SvelteNoUnnecessaryStateWrap = []|[{
  additionalReactiveClasses?: string[]
  allowReassign?: boolean
}]
// ----- svelte/no-unused-class-name -----
type SvelteNoUnusedClassName = []|[{
  allowedClassNames?: string[]
}]
// ----- svelte/no-unused-props -----
type SvelteNoUnusedProps = []|[{
  checkImportedTypes?: boolean
  ignoreTypePatterns?: string[]
  ignorePropertyPatterns?: string[]
  allowUnusedNestedProperties?: boolean
}]
// ----- svelte/no-useless-mustaches -----
type SvelteNoUselessMustaches = []|[{
  ignoreIncludesComment?: boolean
  ignoreStringEscape?: boolean
}]
// ----- svelte/prefer-class-directive -----
type SveltePreferClassDirective = []|[{
  prefer?: ("always" | "empty")
}]
// ----- svelte/prefer-const -----
type SveltePreferConst = []|[{
  destructuring?: ("any" | "all")
  ignoreReadBeforeAssign?: boolean
  excludedRunes?: string[]
  [k: string]: unknown | undefined
}]
// ----- svelte/require-event-prefix -----
type SvelteRequireEventPrefix = []|[{
  checkAsyncFunctions?: boolean
}]
// ----- svelte/shorthand-attribute -----
type SvelteShorthandAttribute = []|[{
  prefer?: ("always" | "never")
}]
// ----- svelte/shorthand-directive -----
type SvelteShorthandDirective = []|[{
  prefer?: ("always" | "never")
}]
// ----- svelte/sort-attributes -----
type SvelteSortAttributes = []|[{
  order?: (string | [string, ...(string)[]] | {
    match: (string | [string, ...(string)[]])
    sort: ("alphabetical" | "ignore")
  })[]
  alphabetical?: boolean
}]
// ----- svelte/spaced-html-comment -----
type SvelteSpacedHtmlComment = []|[("always" | "never")]
// ----- svelte/valid-compile -----
type SvelteValidCompile = []|[{
  ignoreWarnings?: boolean
}]
// ----- switch-colon-spacing -----
type SwitchColonSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- template-curly-spacing -----
type TemplateCurlySpacing = []|[("always" | "never")]
// ----- template-tag-spacing -----
type TemplateTagSpacing = []|[("always" | "never")]
// ----- unicode-bom -----
type UnicodeBom = []|[("always" | "never")]
// ----- unused-imports/no-unused-imports -----
type UnusedImportsNoUnusedImports = []|[(("all" | "local") | {
  
  args?: ("all" | "after-used" | "none")
  
  argsIgnorePattern?: string
  
  caughtErrors?: ("all" | "none")
  
  caughtErrorsIgnorePattern?: string
  
  destructuredArrayIgnorePattern?: string
  
  enableAutofixRemoval?: {
    
    imports?: boolean
  }
  
  ignoreClassWithStaticInitBlock?: boolean
  
  ignoreRestSiblings?: boolean
  
  ignoreUsingDeclarations?: boolean
  
  reportUsedIgnorePattern?: boolean
  
  vars?: ("all" | "local")
  
  varsIgnorePattern?: string
})]
// ----- unused-imports/no-unused-vars -----
type UnusedImportsNoUnusedVars = []|[(("all" | "local") | {
  
  args?: ("all" | "after-used" | "none")
  
  argsIgnorePattern?: string
  
  caughtErrors?: ("all" | "none")
  
  caughtErrorsIgnorePattern?: string
  
  destructuredArrayIgnorePattern?: string
  
  enableAutofixRemoval?: {
    
    imports?: boolean
  }
  
  ignoreClassWithStaticInitBlock?: boolean
  
  ignoreRestSiblings?: boolean
  
  ignoreUsingDeclarations?: boolean
  
  reportUsedIgnorePattern?: boolean
  
  vars?: ("all" | "local")
  
  varsIgnorePattern?: string
})]
// ----- use-isnan -----
type UseIsnan = []|[{
  enforceForSwitchCase?: boolean
  enforceForIndexOf?: boolean
}]
// ----- valid-typeof -----
type ValidTypeof = []|[{
  requireStringLiterals?: boolean
}]
// ----- vitest/consistent-each-for -----
type VitestConsistentEachFor = []|[{
  
  test?: ("each" | "for")
  
  it?: ("each" | "for")
  
  describe?: ("each" | "for")
  
  suite?: ("each" | "for")
}]
// ----- vitest/consistent-test-filename -----
type VitestConsistentTestFilename = []|[{
  
  pattern?: string
  
  allTestPattern?: string
}]
// ----- vitest/consistent-test-it -----
type VitestConsistentTestIt = []|[{
  
  fn?: ("test" | "it")
  
  withinDescribe?: ("test" | "it")
}]
// ----- vitest/consistent-vitest-vi -----
type VitestConsistentVitestVi = []|[{
  
  fn?: ("vi" | "vitest")
}]
// ----- vitest/expect-expect -----
type VitestExpectExpect = []|[{
  
  assertFunctionNames?: string[]
  
  additionalTestBlockFunctions?: string[]
}]
// ----- vitest/max-expects -----
type VitestMaxExpects = []|[{
  
  max?: number
}]
// ----- vitest/max-nested-describe -----
type VitestMaxNestedDescribe = []|[{
  
  max?: number
}]
// ----- vitest/no-conditional-expect -----
type VitestNoConditionalExpect = []|[{
  
  expectAssertions?: boolean
}]
// ----- vitest/no-focused-tests -----
type VitestNoFocusedTests = []|[{
  
  fixable?: boolean
}]
// ----- vitest/no-hooks -----
type VitestNoHooks = []|[{
  
  allow?: ("beforeAll" | "beforeEach" | "afterAll" | "afterEach" | "aroundAll" | "aroundEach")[]
}]
// ----- vitest/no-large-snapshots -----
type VitestNoLargeSnapshots = []|[{
  
  maxSize?: number
  
  inlineMaxSize?: number
  
  allowedSnapshots?: {
    [k: string]: unknown[] | undefined
  }
}]
// ----- vitest/no-restricted-matchers -----
type VitestNoRestrictedMatchers = []|[{
  [k: string]: (string | null) | undefined
}]
// ----- vitest/no-restricted-vi-methods -----
type VitestNoRestrictedViMethods = []|[{
  [k: string]: (string | null) | undefined
}]
// ----- vitest/no-standalone-expect -----
type VitestNoStandaloneExpect = []|[{
  
  additionalTestBlockFunctions?: string[]
}]
// ----- vitest/prefer-expect-assertions -----
type VitestPreferExpectAssertions = []|[{
  
  onlyFunctionsWithAsyncKeyword?: boolean
  
  onlyFunctionsWithExpectInLoop?: boolean
  
  onlyFunctionsWithExpectInCallback?: boolean
  
  disallowHasAssertions?: boolean
}]
// ----- vitest/prefer-import-in-mock -----
type VitestPreferImportInMock = []|[{
  
  fixable?: boolean
}]
// ----- vitest/prefer-lowercase-title -----
type VitestPreferLowercaseTitle = []|[{
  
  ignore?: ("describe" | "test" | "it")[]
  
  allowedPrefixes?: string[]
  
  ignoreTopLevelDescribe?: boolean
  
  lowercaseFirstCharacterOnly?: boolean
}]
// ----- vitest/prefer-snapshot-hint -----
type VitestPreferSnapshotHint = []|[("always" | "multi")]
// ----- vitest/require-hook -----
type VitestRequireHook = []|[{
  
  allowedFunctionCalls?: string[]
}]
// ----- vitest/require-mock-type-parameters -----
type VitestRequireMockTypeParameters = []|[{
  
  checkImportFunctions?: boolean
}]
// ----- vitest/require-top-level-describe -----
type VitestRequireTopLevelDescribe = []|[{
  
  maxNumberOfTopLevelDescribes?: number
}]
// ----- vitest/unbound-method -----
type VitestUnboundMethod = []|[{
  
  ignoreStatic?: boolean
}]
// ----- vitest/valid-expect -----
type VitestValidExpect = []|[{
  
  alwaysAwait?: boolean
  
  asyncMatchers?: string[]
  
  minArgs?: number
  
  maxArgs?: number
}]
// ----- vitest/valid-title -----
type VitestValidTitle = []|[{
  
  ignoreTypeOfDescribeName?: boolean
  
  allowArguments?: boolean
  
  disallowedWords?: string[]
  [k: string]: (string | [string]|[string, string] | {
    [k: string]: (string | [string]|[string, string]) | undefined
  })
}]
// ----- vue/array-bracket-newline -----
type VueArrayBracketNewline = []|[(("always" | "never" | "consistent") | {
  multiline?: boolean
  minItems?: (number | null)
})]
// ----- vue/array-bracket-spacing -----
type VueArrayBracketSpacing = []|[("always" | "never")]|[("always" | "never"), {
  singleValue?: boolean
  objectsInArrays?: boolean
  arraysInArrays?: boolean
}]
// ----- vue/array-element-newline -----
type VueArrayElementNewline = []|[(_VueArrayElementNewlineBasicConfig | {
  ArrayExpression?: _VueArrayElementNewlineBasicConfig
  ArrayPattern?: _VueArrayElementNewlineBasicConfig
})]
type _VueArrayElementNewlineBasicConfig = (("always" | "never" | "consistent") | {
  consistent?: boolean
  multiline?: boolean
  minItems?: (number | null)
})
// ----- vue/arrow-spacing -----
type VueArrowSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- vue/attribute-hyphenation -----
type VueAttributeHyphenation = []|[("always" | "never")]|[("always" | "never"), {
  ignore?: (string & {
    [k: string]: unknown | undefined
  } & {
    [k: string]: unknown | undefined
  })[]
  ignoreTags?: string[]
}]
// ----- vue/attributes-order -----
type VueAttributesOrder = []|[{
  order?: (("DEFINITION" | "LIST_RENDERING" | "CONDITIONALS" | "RENDER_MODIFIERS" | "GLOBAL" | "UNIQUE" | "SLOT" | "TWO_WAY_BINDING" | "OTHER_DIRECTIVES" | "OTHER_ATTR" | "ATTR_STATIC" | "ATTR_DYNAMIC" | "ATTR_SHORTHAND_BOOL" | "EVENTS" | "CONTENT") | ("DEFINITION" | "LIST_RENDERING" | "CONDITIONALS" | "RENDER_MODIFIERS" | "GLOBAL" | "UNIQUE" | "SLOT" | "TWO_WAY_BINDING" | "OTHER_DIRECTIVES" | "OTHER_ATTR" | "ATTR_STATIC" | "ATTR_DYNAMIC" | "ATTR_SHORTHAND_BOOL" | "EVENTS" | "CONTENT")[])[]
  alphabetical?: boolean
  sortLineLength?: boolean
  ignoreVBindObject?: boolean
}]
// ----- vue/block-lang -----
type VueBlockLang = []|[{
  [k: string]: {
    lang?: (string | string[])
    allowNoLang?: boolean
  }
}]
// ----- vue/block-order -----
type VueBlockOrder = []|[{
  order?: (string | string[])[]
}]
// ----- vue/block-spacing -----
type VueBlockSpacing = []|[("always" | "never")]
// ----- vue/block-tag-newline -----
type VueBlockTagNewline = []|[{
  singleline?: ("always" | "never" | "consistent" | "ignore")
  multiline?: ("always" | "never" | "consistent" | "ignore")
  maxEmptyLines?: number
  blocks?: {
    [k: string]: {
      singleline?: ("always" | "never" | "consistent" | "ignore")
      multiline?: ("always" | "never" | "consistent" | "ignore")
      maxEmptyLines?: number
    }
  }
}]
// ----- vue/brace-style -----
type VueBraceStyle = []|[("1tbs" | "stroustrup" | "allman")]|[("1tbs" | "stroustrup" | "allman"), {
  allowSingleLine?: boolean
}]
// ----- vue/camelcase -----
type VueCamelcase = []|[{
  ignoreDestructuring?: boolean
  ignoreImports?: boolean
  ignoreGlobals?: boolean
  properties?: ("always" | "never")
  
  allow?: string[]
}]
// ----- vue/comma-dangle -----
type VueCommaDangle = []|[(_VueCommaDangleValue | {
  arrays?: _VueCommaDangleValueWithIgnore
  objects?: _VueCommaDangleValueWithIgnore
  imports?: _VueCommaDangleValueWithIgnore
  exports?: _VueCommaDangleValueWithIgnore
  functions?: _VueCommaDangleValueWithIgnore
  importAttributes?: _VueCommaDangleValueWithIgnore
  dynamicImports?: _VueCommaDangleValueWithIgnore
  enums?: _VueCommaDangleValueWithIgnore
  generics?: _VueCommaDangleValueWithIgnore
  tuples?: _VueCommaDangleValueWithIgnore
})]
type _VueCommaDangleValue = ("always-multiline" | "always" | "never" | "only-multiline")
type _VueCommaDangleValueWithIgnore = ("always-multiline" | "always" | "never" | "only-multiline" | "ignore")
// ----- vue/comma-spacing -----
type VueCommaSpacing = []|[{
  before?: boolean
  after?: boolean
}]
// ----- vue/comma-style -----
type VueCommaStyle = []|[("first" | "last")]|[("first" | "last"), {
  exceptions?: {
    [k: string]: boolean | undefined
  }
}]
// ----- vue/comment-directive -----
type VueCommentDirective = []|[{
  reportUnusedDisableDirectives?: boolean
}]
// ----- vue/component-api-style -----
type VueComponentApiStyle = []|[[("script-setup" | "composition" | "composition-vue2" | "options"), ...(("script-setup" | "composition" | "composition-vue2" | "options"))[]]]
// ----- vue/component-definition-name-casing -----
type VueComponentDefinitionNameCasing = []|[("PascalCase" | "kebab-case")]
// ----- vue/component-name-in-template-casing -----
type VueComponentNameInTemplateCasing = []|[("PascalCase" | "kebab-case")]|[("PascalCase" | "kebab-case"), {
  globals?: string[]
  ignores?: string[]
  registeredComponentsOnly?: boolean
}]
// ----- vue/component-options-name-casing -----
type VueComponentOptionsNameCasing = []|[("camelCase" | "kebab-case" | "PascalCase")]
// ----- vue/custom-event-name-casing -----
type VueCustomEventNameCasing = []|[("kebab-case" | "camelCase")]|[("kebab-case" | "camelCase"), {
  ignores?: string[]
}]
// ----- vue/define-emits-declaration -----
type VueDefineEmitsDeclaration = []|[("type-based" | "type-literal" | "runtime")]
// ----- vue/define-macros-order -----
type VueDefineMacrosOrder = []|[{
  order?: string[]
  defineExposeLast?: boolean
}]
// ----- vue/define-props-declaration -----
type VueDefinePropsDeclaration = []|[("type-based" | "runtime")]
// ----- vue/define-props-destructuring -----
type VueDefinePropsDestructuring = []|[{
  destructure?: ("only-when-assigned" | "always" | "never")
}]
// ----- vue/dot-location -----
type VueDotLocation = []|[("object" | "property")]
// ----- vue/dot-notation -----
type VueDotNotation = []|[{
  allowKeywords?: boolean
  allowPattern?: string
}]
// ----- vue/enforce-style-attribute -----
type VueEnforceStyleAttribute = []|[{
  
  allow?: [("plain" | "scoped" | "module"), ...(("plain" | "scoped" | "module"))[]]
}]
// ----- vue/eqeqeq -----
type VueEqeqeq = ([]|["always"]|["always", {
  null?: ("always" | "never" | "ignore")
}] | []|[("smart" | "allow-null")])
// ----- vue/first-attribute-linebreak -----
type VueFirstAttributeLinebreak = []|[{
  multiline?: ("below" | "beside" | "ignore")
  singleline?: ("below" | "beside" | "ignore")
}]
// ----- vue/func-call-spacing -----
type VueFuncCallSpacing = ([]|["never"] | []|["always"]|["always", {
  allowNewlines?: boolean
  optionalChain?: {
    before?: boolean
    after?: boolean
  }
}])
// ----- vue/html-button-has-type -----
type VueHtmlButtonHasType = []|[{
  button?: boolean
  submit?: boolean
  reset?: boolean
}]
// ----- vue/html-closing-bracket-newline -----
type VueHtmlClosingBracketNewline = []|[{
  singleline?: ("always" | "never")
  multiline?: ("always" | "never")
  selfClosingTag?: {
    singleline?: ("always" | "never")
    multiline?: ("always" | "never")
  }
}]
// ----- vue/html-closing-bracket-spacing -----
type VueHtmlClosingBracketSpacing = []|[{
  startTag?: ("always" | "never")
  endTag?: ("always" | "never")
  selfClosingTag?: ("always" | "never")
}]
// ----- vue/html-comment-content-newline -----
type VueHtmlCommentContentNewline = []|[(("always" | "never") | {
  singleline?: ("always" | "never" | "ignore")
  multiline?: ("always" | "never" | "ignore")
})]|[(("always" | "never") | {
  singleline?: ("always" | "never" | "ignore")
  multiline?: ("always" | "never" | "ignore")
}), {
  exceptions?: string[]
}]
// ----- vue/html-comment-content-spacing -----
type VueHtmlCommentContentSpacing = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: string[]
}]
// ----- vue/html-comment-indent -----
type VueHtmlCommentIndent = []|[(number | "tab")]
// ----- vue/html-indent -----
type VueHtmlIndent = []|[(number | "tab")]|[(number | "tab"), {
  attribute?: number
  baseIndent?: number
  closeBracket?: (number | {
    startTag?: number
    endTag?: number
    selfClosingTag?: number
  })
  switchCase?: number
  alignAttributesVertically?: boolean
  ignores?: (string & {
    [k: string]: unknown | undefined
  } & {
    [k: string]: unknown | undefined
  })[]
}]
// ----- vue/html-quotes -----
type VueHtmlQuotes = []|[("double" | "single")]|[("double" | "single"), {
  avoidEscape?: boolean
}]
// ----- vue/html-self-closing -----
type VueHtmlSelfClosing = []|[{
  html?: {
    normal?: _VueHtmlSelfClosingOptionValue
    void?: _VueHtmlSelfClosingOptionValue
    component?: _VueHtmlSelfClosingOptionValue
  }
  svg?: _VueHtmlSelfClosingOptionValue
  math?: _VueHtmlSelfClosingOptionValue
}]
type _VueHtmlSelfClosingOptionValue = ("always" | "never" | "any")
// ----- vue/key-spacing -----
type VueKeySpacing = []|[({
  align?: (("colon" | "value") | {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  })
  mode?: ("strict" | "minimum")
  beforeColon?: boolean
  afterColon?: boolean
  ignoredNodes?: ("ObjectExpression" | "ObjectPattern" | "ImportDeclaration" | "ExportNamedDeclaration" | "ExportAllDeclaration" | "TSTypeLiteral" | "TSInterfaceBody" | "ClassBody")[]
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    align?: (("colon" | "value") | {
      mode?: ("strict" | "minimum")
      on?: ("colon" | "value")
      beforeColon?: boolean
      afterColon?: boolean
    })
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
} | {
  singleLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  multiLine?: {
    mode?: ("strict" | "minimum")
    beforeColon?: boolean
    afterColon?: boolean
  }
  align?: {
    mode?: ("strict" | "minimum")
    on?: ("colon" | "value")
    beforeColon?: boolean
    afterColon?: boolean
  }
})]
// ----- vue/keyword-spacing -----
type VueKeywordSpacing = []|[{
  before?: boolean
  after?: boolean
  overrides?: {
    abstract?: {
      before?: boolean
      after?: boolean
    }
    boolean?: {
      before?: boolean
      after?: boolean
    }
    break?: {
      before?: boolean
      after?: boolean
    }
    byte?: {
      before?: boolean
      after?: boolean
    }
    case?: {
      before?: boolean
      after?: boolean
    }
    catch?: {
      before?: boolean
      after?: boolean
    }
    char?: {
      before?: boolean
      after?: boolean
    }
    class?: {
      before?: boolean
      after?: boolean
    }
    const?: {
      before?: boolean
      after?: boolean
    }
    continue?: {
      before?: boolean
      after?: boolean
    }
    debugger?: {
      before?: boolean
      after?: boolean
    }
    default?: {
      before?: boolean
      after?: boolean
    }
    delete?: {
      before?: boolean
      after?: boolean
    }
    do?: {
      before?: boolean
      after?: boolean
    }
    double?: {
      before?: boolean
      after?: boolean
    }
    else?: {
      before?: boolean
      after?: boolean
    }
    enum?: {
      before?: boolean
      after?: boolean
    }
    export?: {
      before?: boolean
      after?: boolean
    }
    extends?: {
      before?: boolean
      after?: boolean
    }
    false?: {
      before?: boolean
      after?: boolean
    }
    final?: {
      before?: boolean
      after?: boolean
    }
    finally?: {
      before?: boolean
      after?: boolean
    }
    float?: {
      before?: boolean
      after?: boolean
    }
    for?: {
      before?: boolean
      after?: boolean
    }
    function?: {
      before?: boolean
      after?: boolean
    }
    goto?: {
      before?: boolean
      after?: boolean
    }
    if?: {
      before?: boolean
      after?: boolean
    }
    implements?: {
      before?: boolean
      after?: boolean
    }
    import?: {
      before?: boolean
      after?: boolean
    }
    in?: {
      before?: boolean
      after?: boolean
    }
    instanceof?: {
      before?: boolean
      after?: boolean
    }
    int?: {
      before?: boolean
      after?: boolean
    }
    interface?: {
      before?: boolean
      after?: boolean
    }
    long?: {
      before?: boolean
      after?: boolean
    }
    native?: {
      before?: boolean
      after?: boolean
    }
    new?: {
      before?: boolean
      after?: boolean
    }
    null?: {
      before?: boolean
      after?: boolean
    }
    package?: {
      before?: boolean
      after?: boolean
    }
    private?: {
      before?: boolean
      after?: boolean
    }
    protected?: {
      before?: boolean
      after?: boolean
    }
    public?: {
      before?: boolean
      after?: boolean
    }
    return?: {
      before?: boolean
      after?: boolean
    }
    short?: {
      before?: boolean
      after?: boolean
    }
    static?: {
      before?: boolean
      after?: boolean
    }
    super?: {
      before?: boolean
      after?: boolean
    }
    switch?: {
      before?: boolean
      after?: boolean
    }
    synchronized?: {
      before?: boolean
      after?: boolean
    }
    this?: {
      before?: boolean
      after?: boolean
    }
    throw?: {
      before?: boolean
      after?: boolean
    }
    throws?: {
      before?: boolean
      after?: boolean
    }
    transient?: {
      before?: boolean
      after?: boolean
    }
    true?: {
      before?: boolean
      after?: boolean
    }
    try?: {
      before?: boolean
      after?: boolean
    }
    typeof?: {
      before?: boolean
      after?: boolean
    }
    var?: {
      before?: boolean
      after?: boolean
    }
    void?: {
      before?: boolean
      after?: boolean
    }
    volatile?: {
      before?: boolean
      after?: boolean
    }
    while?: {
      before?: boolean
      after?: boolean
    }
    with?: {
      before?: boolean
      after?: boolean
    }
    arguments?: {
      before?: boolean
      after?: boolean
    }
    as?: {
      before?: boolean
      after?: boolean
    }
    async?: {
      before?: boolean
      after?: boolean
    }
    await?: {
      before?: boolean
      after?: boolean
    }
    eval?: {
      before?: boolean
      after?: boolean
    }
    from?: {
      before?: boolean
      after?: boolean
    }
    get?: {
      before?: boolean
      after?: boolean
    }
    let?: {
      before?: boolean
      after?: boolean
    }
    of?: {
      before?: boolean
      after?: boolean
    }
    set?: {
      before?: boolean
      after?: boolean
    }
    type?: {
      before?: boolean
      after?: boolean
    }
    using?: {
      before?: boolean
      after?: boolean
    }
    yield?: {
      before?: boolean
      after?: boolean
    }
    accessor?: {
      before?: boolean
      after?: boolean
    }
    satisfies?: {
      before?: boolean
      after?: boolean
    }
  }
}]
// ----- vue/match-component-file-name -----
type VueMatchComponentFileName = []|[{
  extensions?: string[]
  shouldMatchCase?: boolean
}]
// ----- vue/max-attributes-per-line -----
type VueMaxAttributesPerLine = []|[{
  singleline?: (number | {
    max?: number
  })
  multiline?: (number | {
    max?: number
  })
}]
// ----- vue/max-len -----
type VueMaxLen = []|[({
  code?: number
  template?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreTrailingComments?: boolean
  ignoreUrls?: boolean
  ignoreStrings?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreHTMLAttributeValues?: boolean
  ignoreHTMLTextContents?: boolean
} | number)]|[({
  code?: number
  template?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreTrailingComments?: boolean
  ignoreUrls?: boolean
  ignoreStrings?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreHTMLAttributeValues?: boolean
  ignoreHTMLTextContents?: boolean
} | number), ({
  code?: number
  template?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreTrailingComments?: boolean
  ignoreUrls?: boolean
  ignoreStrings?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreHTMLAttributeValues?: boolean
  ignoreHTMLTextContents?: boolean
} | number)]|[({
  code?: number
  template?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreTrailingComments?: boolean
  ignoreUrls?: boolean
  ignoreStrings?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreHTMLAttributeValues?: boolean
  ignoreHTMLTextContents?: boolean
} | number), ({
  code?: number
  template?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreTrailingComments?: boolean
  ignoreUrls?: boolean
  ignoreStrings?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreHTMLAttributeValues?: boolean
  ignoreHTMLTextContents?: boolean
} | number), {
  code?: number
  template?: number
  comments?: number
  tabWidth?: number
  ignorePattern?: string
  ignoreComments?: boolean
  ignoreTrailingComments?: boolean
  ignoreUrls?: boolean
  ignoreStrings?: boolean
  ignoreTemplateLiterals?: boolean
  ignoreRegExpLiterals?: boolean
  ignoreHTMLAttributeValues?: boolean
  ignoreHTMLTextContents?: boolean
}]
// ----- vue/max-lines-per-block -----
type VueMaxLinesPerBlock = []|[{
  style?: number
  template?: number
  script?: number
  skipBlankLines?: boolean
}]
// ----- vue/max-props -----
type VueMaxProps = []|[{
  maxProps?: number
}]
// ----- vue/max-template-depth -----
type VueMaxTemplateDepth = []|[{
  maxDepth?: number
}]
// ----- vue/multi-word-component-names -----
type VueMultiWordComponentNames = []|[{
  ignores?: string[]
}]
// ----- vue/multiline-html-element-content-newline -----
type VueMultilineHtmlElementContentNewline = []|[{
  ignoreWhenEmpty?: boolean
  ignores?: string[]
  allowEmptyLines?: boolean
}]
// ----- vue/multiline-ternary -----
type VueMultilineTernary = []|[("always" | "always-multiline" | "never")]|[("always" | "always-multiline" | "never"), {
  ignoreJSX?: boolean
}]
// ----- vue/mustache-interpolation-spacing -----
type VueMustacheInterpolationSpacing = []|[("always" | "never")]
// ----- vue/new-line-between-multi-line-property -----
type VueNewLineBetweenMultiLineProperty = []|[{
  minLineOfMultilineProperty?: number
}]
// ----- vue/next-tick-style -----
type VueNextTickStyle = []|[("promise" | "callback")]
// ----- vue/no-async-in-computed-properties -----
type VueNoAsyncInComputedProperties = []|[{
  ignoredObjectNames?: string[]
}]
// ----- vue/no-bare-strings-in-template -----
type VueNoBareStringsInTemplate = []|[{
  allowlist?: string[]
  attributes?: {
    [k: string]: string[]
  }
  directives?: string[]
}]
// ----- vue/no-boolean-default -----
type VueNoBooleanDefault = []|[("default-false" | "no-default")]
// ----- vue/no-child-content -----
type VueNoChildContent = []|[{
  
  additionalDirectives: [string, ...(string)[]]
}]
// ----- vue/no-console -----
type VueNoConsole = []|[{
  
  allow?: [string, ...(string)[]]
}]
// ----- vue/no-constant-condition -----
type VueNoConstantCondition = []|[{
  checkLoops?: ("all" | "allExceptWhileTrue" | "none" | true | false)
}]
// ----- vue/no-deprecated-model-definition -----
type VueNoDeprecatedModelDefinition = []|[{
  allowVue3Compat?: boolean
}]
// ----- vue/no-deprecated-router-link-tag-prop -----
type VueNoDeprecatedRouterLinkTagProp = []|[{
  
  components?: [string, ...(string)[]]
}]
// ----- vue/no-deprecated-slot-attribute -----
type VueNoDeprecatedSlotAttribute = []|[{
  ignore?: string[]
  ignoreParents?: string[]
}]
// ----- vue/no-dupe-keys -----
type VueNoDupeKeys = []|[{
  groups?: string[]
}]
// ----- vue/no-duplicate-attr-inheritance -----
type VueNoDuplicateAttrInheritance = []|[{
  checkMultiRootNodes?: boolean
}]
// ----- vue/no-duplicate-attributes -----
type VueNoDuplicateAttributes = []|[{
  allowCoexistClass?: boolean
  allowCoexistStyle?: boolean
}]
// ----- vue/no-empty-pattern -----
type VueNoEmptyPattern = []|[{
  allowObjectPatternsAsParameters?: boolean
}]
// ----- vue/no-extra-parens -----
type VueNoExtraParens = ([]|["functions"] | []|["all"]|["all", {
  conditionalAssign?: boolean
  ternaryOperandBinaryExpressions?: boolean
  nestedBinaryExpressions?: boolean
  returnAssign?: boolean
  ignoreJSX?: ("none" | "all" | "single-line" | "multi-line")
  enforceForArrowConditionals?: boolean
  enforceForSequenceExpressions?: boolean
  enforceForNewInMemberExpressions?: boolean
  enforceForFunctionPrototypeMethods?: boolean
  allowParensAfterCommentPattern?: string
  nestedConditionalExpressions?: boolean
  allowNodesInSpreadElement?: {
    ConditionalExpression?: boolean
    LogicalExpression?: boolean
    AwaitExpression?: boolean
  }
  ignoredNodes?: string[]
}])
// ----- vue/no-implicit-coercion -----
type VueNoImplicitCoercion = []|[{
  boolean?: boolean
  number?: boolean
  string?: boolean
  disallowTemplateShorthand?: boolean
  allow?: ("~" | "!!" | "+" | "- -" | "-" | "*")[]
}]
// ----- vue/no-irregular-whitespace -----
type VueNoIrregularWhitespace = []|[{
  skipComments?: boolean
  skipStrings?: boolean
  skipTemplates?: boolean
  skipRegExps?: boolean
  skipHTMLAttributeValues?: boolean
  skipHTMLTextContents?: boolean
}]
// ----- vue/no-literals-in-template -----
type VueNoLiteralsInTemplate = []|[{
  ignores?: string[]
}]
// ----- vue/no-lone-template -----
type VueNoLoneTemplate = []|[{
  ignoreAccessible?: boolean
}]
// ----- vue/no-multi-spaces -----
type VueNoMultiSpaces = []|[{
  ignoreProperties?: boolean
  ignoreEOLComments?: boolean
}]
// ----- vue/no-multiple-template-root -----
type VueNoMultipleTemplateRoot = []|[{
  disallowComments?: boolean
}]
// ----- vue/no-mutating-props -----
type VueNoMutatingProps = []|[{
  shallowOnly?: boolean
}]
// ----- vue/no-parsing-error -----
type VueNoParsingError = []|[{
  "abrupt-closing-of-empty-comment"?: boolean
  "absence-of-digits-in-numeric-character-reference"?: boolean
  "cdata-in-html-content"?: boolean
  "character-reference-outside-unicode-range"?: boolean
  "control-character-in-input-stream"?: boolean
  "control-character-reference"?: boolean
  "eof-before-tag-name"?: boolean
  "eof-in-cdata"?: boolean
  "eof-in-comment"?: boolean
  "eof-in-tag"?: boolean
  "incorrectly-closed-comment"?: boolean
  "incorrectly-opened-comment"?: boolean
  "invalid-first-character-of-tag-name"?: boolean
  "missing-attribute-value"?: boolean
  "missing-end-tag-name"?: boolean
  "missing-semicolon-after-character-reference"?: boolean
  "missing-whitespace-between-attributes"?: boolean
  "nested-comment"?: boolean
  "noncharacter-character-reference"?: boolean
  "noncharacter-in-input-stream"?: boolean
  "null-character-reference"?: boolean
  "surrogate-character-reference"?: boolean
  "surrogate-in-input-stream"?: boolean
  "unexpected-character-in-attribute-name"?: boolean
  "unexpected-character-in-unquoted-attribute-value"?: boolean
  "unexpected-equals-sign-before-attribute-name"?: boolean
  "unexpected-null-character"?: boolean
  "unexpected-question-mark-instead-of-tag-name"?: boolean
  "unexpected-solidus-in-tag"?: boolean
  "unknown-named-character-reference"?: boolean
  "end-tag-with-attributes"?: boolean
  "duplicate-attribute"?: boolean
  "end-tag-with-trailing-solidus"?: boolean
  "non-void-html-element-start-tag-with-trailing-solidus"?: boolean
  "x-invalid-end-tag"?: boolean
  "x-invalid-namespace"?: boolean
}]
// ----- vue/no-potential-component-option-typo -----
type VueNoPotentialComponentOptionTypo = []|[{
  
  presets?: ("all" | "vue" | "vue-router" | "nuxt")[]
  
  custom?: string[]
  threshold?: number
}]
// ----- vue/no-required-prop-with-default -----
type VueNoRequiredPropWithDefault = []|[{
  autofix?: boolean
}]
// ----- vue/no-reserved-component-names -----
type VueNoReservedComponentNames = []|[{
  disallowVueBuiltInComponents?: boolean
  disallowVue3BuiltInComponents?: boolean
  htmlElementCaseSensitive?: boolean
}]
// ----- vue/no-reserved-keys -----
type VueNoReservedKeys = []|[{
  reserved?: string[]
  groups?: string[]
}]
// ----- vue/no-reserved-props -----
type VueNoReservedProps = []|[{
  vueVersion?: (2 | 3)
}]
// ----- vue/no-restricted-block -----
type VueNoRestrictedBlock = (string | {
  element: string
  message?: string
})[]
// ----- vue/no-restricted-call-after-await -----
type VueNoRestrictedCallAfterAwait = {
  module: string
  path?: (string | string[])
  message?: string
}[]
// ----- vue/no-restricted-class -----
type VueNoRestrictedClass = string[]
// ----- vue/no-restricted-component-names -----
type VueNoRestrictedComponentNames = (string | {
  name: string
  message?: string
  suggest?: string
})[]
// ----- vue/no-restricted-component-options -----
type VueNoRestrictedComponentOptions = (string | string[] | {
  name: (string | string[])
  message?: string
})[]
// ----- vue/no-restricted-custom-event -----
type VueNoRestrictedCustomEvent = (string | {
  event: string
  message?: string
  suggest?: string
})[]
// ----- vue/no-restricted-html-elements -----
type VueNoRestrictedHtmlElements = (string | {
  element: (string | string[])
  message?: string
})[]
// ----- vue/no-restricted-props -----
type VueNoRestrictedProps = (string | {
  name: string
  message?: string
  suggest?: string
})[]
// ----- vue/no-restricted-static-attribute -----
type VueNoRestrictedStaticAttribute = (string | {
  key: string
  value?: (string | true)
  element?: string
  message?: string
})[]
// ----- vue/no-restricted-syntax -----
type VueNoRestrictedSyntax = (string | {
  selector: string
  message?: string
})[]
// ----- vue/no-restricted-v-bind -----
type VueNoRestrictedVBind = ((string | null) | {
  argument: (string | null)
  modifiers?: ("prop" | "camel" | "sync" | "attr")[]
  element?: string
  message?: string
})[]
// ----- vue/no-restricted-v-on -----
type VueNoRestrictedVOn = ((string | null) | {
  argument: (string | null)
  element?: string
  message?: string
  
  modifiers?: [("prevent" | "stop" | "capture" | "self" | "once" | "passive"), ...(("prevent" | "stop" | "capture" | "self" | "once" | "passive"))[]]
})[]
// ----- vue/no-static-inline-styles -----
type VueNoStaticInlineStyles = []|[{
  allowBinding?: boolean
}]
// ----- vue/no-template-shadow -----
type VueNoTemplateShadow = []|[{
  allow?: string[]
}]
// ----- vue/no-template-target-blank -----
type VueNoTemplateTargetBlank = []|[{
  allowReferrer?: boolean
  enforceDynamicLinks?: ("always" | "never")
}]
// ----- vue/no-undef-components -----
type VueNoUndefComponents = []|[{
  ignorePatterns?: string[]
}]
// ----- vue/no-undef-directives -----
type VueNoUndefDirectives = []|[{
  ignore?: string[]
}]
// ----- vue/no-undef-properties -----
type VueNoUndefProperties = []|[{
  ignores?: string[]
}]
// ----- vue/no-unsupported-features -----
type VueNoUnsupportedFeatures = []|[{
  version?: string
  ignores?: ("slot-scope-attribute" | "dynamic-directive-arguments" | "v-slot" | "script-setup" | "style-css-vars-injection" | "v-model-argument" | "v-model-custom-modifiers" | "v-is" | "is-attribute-with-vue-prefix" | "v-memo" | "v-bind-prop-modifier-shorthand" | "v-bind-attr-modifier" | "define-options" | "define-slots" | "define-model" | "v-bind-same-name-shorthand")[]
}]
// ----- vue/no-unused-components -----
type VueNoUnusedComponents = []|[{
  ignoreWhenBindingPresent?: boolean
}]
// ----- vue/no-unused-properties -----
type VueNoUnusedProperties = []|[{
  groups?: ("props" | "data" | "asyncData" | "computed" | "methods" | "setup" | "inject")[]
  deepData?: boolean
  ignorePublicMembers?: boolean
  unreferencedOptions?: ("unknownMemberAsUnreferenced" | "returnAsUnreferenced")[]
}]
// ----- vue/no-unused-vars -----
type VueNoUnusedVars = []|[{
  ignorePattern?: string
}]
// ----- vue/no-use-v-if-with-v-for -----
type VueNoUseVIfWithVFor = []|[{
  allowUsingIterationVar?: boolean
}]
// ----- vue/no-useless-mustaches -----
type VueNoUselessMustaches = []|[{
  ignoreIncludesComment?: boolean
  ignoreStringEscape?: boolean
}]
// ----- vue/no-useless-v-bind -----
type VueNoUselessVBind = []|[{
  ignoreIncludesComment?: boolean
  ignoreStringEscape?: boolean
}]
// ----- vue/no-v-html -----
type VueNoVHtml = []|[{
  ignorePattern?: string
}]
// ----- vue/no-v-text-v-html-on-component -----
type VueNoVTextVHtmlOnComponent = []|[{
  allow?: string[]
  ignoreElementNamespaces?: boolean
}]
// ----- vue/object-curly-newline -----
type VueObjectCurlyNewline = []|[((("always" | "never") | {
  multiline?: boolean
  minProperties?: number
  consistent?: boolean
}) | {
  ObjectExpression?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ObjectPattern?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ImportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  ExportDeclaration?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSTypeLiteral?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSInterfaceBody?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
  TSEnumBody?: (("always" | "never") | {
    multiline?: boolean
    minProperties?: number
    consistent?: boolean
  })
})]
// ----- vue/object-curly-spacing -----
type VueObjectCurlySpacing = []|[("always" | "never")]|[("always" | "never"), {
  arraysInObjects?: boolean
  objectsInObjects?: boolean
  overrides?: {
    ObjectPattern?: ("always" | "never")
    ObjectExpression?: ("always" | "never")
    ImportDeclaration?: ("always" | "never")
    ImportAttributes?: ("always" | "never")
    ExportNamedDeclaration?: ("always" | "never")
    ExportAllDeclaration?: ("always" | "never")
    TSMappedType?: ("always" | "never")
    TSTypeLiteral?: ("always" | "never")
    TSInterfaceBody?: ("always" | "never")
    TSEnumBody?: ("always" | "never")
  }
  emptyObjects?: ("ignore" | "always" | "never")
}]
// ----- vue/object-property-newline -----
type VueObjectPropertyNewline = []|[{
  allowAllPropertiesOnSameLine?: boolean
}]
// ----- vue/object-shorthand -----
type VueObjectShorthand = ([]|[("always" | "methods" | "properties" | "never" | "consistent" | "consistent-as-needed")] | []|[("always" | "methods" | "properties")]|[("always" | "methods" | "properties"), {
  avoidQuotes?: boolean
}] | []|[("always" | "methods")]|[("always" | "methods"), {
  ignoreConstructors?: boolean
  methodsIgnorePattern?: string
  avoidQuotes?: boolean
  avoidExplicitReturnArrows?: boolean
}])
// ----- vue/operator-linebreak -----
type VueOperatorLinebreak = []|[(("after" | "before" | "none") | null)]|[(("after" | "before" | "none") | null), {
  overrides?: {
    [k: string]: ("after" | "before" | "none" | "ignore") | undefined
  }
}]
// ----- vue/order-in-components -----
type VueOrderInComponents = []|[{
  order?: (string | string[])[]
}]
// ----- vue/padding-line-between-blocks -----
type VuePaddingLineBetweenBlocks = []|[("never" | "always")]
// ----- vue/padding-line-between-tags -----
type VuePaddingLineBetweenTags = []|[{
  blankLine: ("always" | "never" | "consistent")
  prev: string
  next: string
}[]]
// ----- vue/padding-lines-in-component-definition -----
type VuePaddingLinesInComponentDefinition = []|[(("always" | "never") | {
  betweenOptions?: ("never" | "always" | "ignore")
  withinOption?: (("never" | "always" | "ignore") | {
    [k: string]: (("never" | "always" | "ignore") | {
      betweenItems?: ("never" | "always" | "ignore")
      withinEach?: ("never" | "always" | "ignore")
    })
  })
  groupSingleLineProperties?: boolean
})]
// ----- vue/prefer-true-attribute-shorthand -----
type VuePreferTrueAttributeShorthand = []|[("always" | "never")]|[("always" | "never"), {
  except?: string[]
}]
// ----- vue/prop-name-casing -----
type VuePropNameCasing = []|[("camelCase" | "snake_case")]|[("camelCase" | "snake_case"), {
  ignoreProps?: string[]
}]
// ----- vue/quote-props -----
type VueQuoteProps = ([]|[("always" | "as-needed" | "consistent" | "consistent-as-needed")] | []|[("always" | "as-needed" | "consistent" | "consistent-as-needed")]|[("always" | "as-needed" | "consistent" | "consistent-as-needed"), {
  keywords?: boolean
  unnecessary?: boolean
  numbers?: boolean
}])
// ----- vue/require-direct-export -----
type VueRequireDirectExport = []|[{
  disallowFunctionalComponentFunction?: boolean
}]
// ----- vue/require-explicit-emits -----
type VueRequireExplicitEmits = []|[{
  allowProps?: boolean
}]
// ----- vue/require-macro-variable-name -----
type VueRequireMacroVariableName = []|[{
  defineProps?: string
  defineEmits?: string
  defineSlots?: string
  useSlots?: string
  useAttrs?: string
}]
// ----- vue/require-prop-comment -----
type VueRequirePropComment = []|[{
  type?: ("JSDoc" | "line" | "block" | "any")
}]
// ----- vue/require-toggle-inside-transition -----
type VueRequireToggleInsideTransition = []|[{
  additionalDirectives?: string[]
}]
// ----- vue/restricted-component-names -----
type VueRestrictedComponentNames = []|[{
  allow?: string[]
}]
// ----- vue/return-in-computed-property -----
type VueReturnInComputedProperty = []|[{
  treatUndefinedAsUnspecified?: boolean
}]
// ----- vue/script-indent -----
type VueScriptIndent = []|[(number | "tab")]|[(number | "tab"), {
  baseIndent?: number
  switchCase?: number
  ignores?: (string & {
    [k: string]: unknown | undefined
  } & {
    [k: string]: unknown | undefined
  })[]
}]
// ----- vue/singleline-html-element-content-newline -----
type VueSinglelineHtmlElementContentNewline = []|[{
  ignoreWhenNoAttributes?: boolean
  ignoreWhenEmpty?: boolean
  ignores?: string[]
  externalIgnores?: string[]
}]
// ----- vue/slot-name-casing -----
type VueSlotNameCasing = []|[("camelCase" | "kebab-case" | "singleword")]
// ----- vue/sort-keys -----
type VueSortKeys = []|[("asc" | "desc")]|[("asc" | "desc"), {
  caseSensitive?: boolean
  ignoreChildrenOf?: string[]
  ignoreGrandchildrenOf?: string[]
  minKeys?: number
  natural?: boolean
  allowLineSeparatedGroups?: boolean
}]
// ----- vue/space-in-parens -----
type VueSpaceInParens = []|[("always" | "never")]|[("always" | "never"), {
  exceptions?: ("{}" | "[]" | "()" | "empty")[]
}]
// ----- vue/space-infix-ops -----
type VueSpaceInfixOps = []|[{
  int32Hint?: boolean
  ignoreTypes?: boolean
}]
// ----- vue/space-unary-ops -----
type VueSpaceUnaryOps = []|[{
  words?: boolean
  nonwords?: boolean
  overrides?: {
    [k: string]: boolean | undefined
  }
}]
// ----- vue/template-curly-spacing -----
type VueTemplateCurlySpacing = []|[("always" | "never")]
// ----- vue/this-in-template -----
type VueThisInTemplate = []|[("always" | "never")]
// ----- vue/v-bind-style -----
type VueVBindStyle = []|[("shorthand" | "longform")]|[("shorthand" | "longform"), {
  sameNameShorthand?: ("always" | "never" | "ignore")
}]
// ----- vue/v-for-delimiter-style -----
type VueVForDelimiterStyle = []|[("in" | "of")]
// ----- vue/v-on-event-hyphenation -----
type VueVOnEventHyphenation = []|[("always" | "never")]|[("always" | "never"), {
  autofix?: boolean
  ignore?: (string & {
    [k: string]: unknown | undefined
  } & {
    [k: string]: unknown | undefined
  })[]
  ignoreTags?: string[]
}]
// ----- vue/v-on-handler-style -----
type VueVOnHandlerStyle = []|[(("inline" | "inline-function") | ["method", ("inline" | "inline-function")])]|[(("inline" | "inline-function") | ["method", ("inline" | "inline-function")]), {
  ignoreIncludesComment?: boolean
}]
// ----- vue/v-on-style -----
type VueVOnStyle = []|[("shorthand" | "longform")]
// ----- vue/v-slot-style -----
type VueVSlotStyle = []|[(("shorthand" | "longform") | {
  atComponent?: ("shorthand" | "longform" | "v-slot")
  default?: ("shorthand" | "longform" | "v-slot")
  named?: ("shorthand" | "longform")
})]
// ----- vue/valid-v-for -----
type VueValidVFor = []|[{
  allowEmptyAlias?: boolean
}]
// ----- vue/valid-v-on -----
type VueValidVOn = []|[{
  modifiers?: string[]
}]
// ----- vue/valid-v-slot -----
type VueValidVSlot = []|[{
  allowModifiers?: boolean
}]
// ----- vuejs-accessibility/alt-text -----
type VuejsAccessibilityAltText = []|[{
  elements?: string[]
  img?: string[]
  object?: string[]
  area?: string[]
  "input[type=\"image\"]"?: string[]
  [k: string]: unknown | undefined
}]
// ----- vuejs-accessibility/anchor-has-content -----
type VuejsAccessibilityAnchorHasContent = []|[{
  components?: string[]
  accessibleChildren?: string[]
  accessibleDirectives?: string[]
  [k: string]: unknown | undefined
}]
// ----- vuejs-accessibility/aria-role -----
type VuejsAccessibilityAriaRole = []|[{
  ignoreNonDOM?: boolean
}]
// ----- vuejs-accessibility/form-control-has-label -----
type VuejsAccessibilityFormControlHasLabel = []|[{
  labelComponents?: string[]
  controlComponents?: string[]
  [k: string]: unknown | undefined
}]
// ----- vuejs-accessibility/heading-has-content -----
type VuejsAccessibilityHeadingHasContent = []|[{
  components?: string[]
  accessibleChildren?: string[]
  accessibleDirectives?: string[]
  [k: string]: unknown | undefined
}]
// ----- vuejs-accessibility/interactive-supports-focus -----
type VuejsAccessibilityInteractiveSupportsFocus = []|[{
  tabbable?: ("button" | "checkbox" | "columnheader" | "combobox" | "grid" | "gridcell" | "link" | "listbox" | "menu" | "menubar" | "menuitem" | "menuitemcheckbox" | "menuitemradio" | "option" | "progressbar" | "radio" | "radiogroup" | "row" | "rowheader" | "scrollbar" | "searchbox" | "slider" | "spinbutton" | "switch" | "tab" | "tablist" | "textbox" | "tree" | "treegrid" | "treeitem" | "doc-backlink" | "doc-biblioref" | "doc-glossref" | "doc-noteref")[]
  [k: string]: unknown | undefined
}]
// ----- vuejs-accessibility/label-has-for -----
type VuejsAccessibilityLabelHasFor = []|[{
  components?: string[]
  controlComponents?: string[]
  required?: (("nesting" | "id") | {
    some: ("nesting" | "id")[]
    [k: string]: unknown | undefined
  } | {
    every: ("nesting" | "id")[]
    [k: string]: unknown | undefined
  })
  allowChildren?: boolean
  [k: string]: unknown | undefined
}]
// ----- vuejs-accessibility/media-has-caption -----
type VuejsAccessibilityMediaHasCaption = []|[{
  audio?: string[]
  track?: string[]
  video?: string[]
  [k: string]: unknown | undefined
}]
// ----- vuejs-accessibility/no-autofocus -----
type VuejsAccessibilityNoAutofocus = []|[{
  ignoreNonDOM?: boolean
}]
// ----- vuejs-accessibility/no-distracting-elements -----
type VuejsAccessibilityNoDistractingElements = []|[{
  [k: string]: unknown | undefined
}]
// ----- vuejs-accessibility/no-redundant-roles -----
type VuejsAccessibilityNoRedundantRoles = []|[{
  [k: string]: string[] | undefined
}]
// ----- wrap-iife -----
type WrapIife = []|[("outside" | "inside" | "any")]|[("outside" | "inside" | "any"), {
  functionPrototypeMethods?: boolean
}]
// ----- yield-star-spacing -----
type YieldStarSpacing = []|[(("before" | "after" | "both" | "neither") | {
  before?: boolean
  after?: boolean
})]
// ----- yoda -----
type Yoda = []|[("always" | "never")]|[("always" | "never"), {
  exceptRange?: boolean
  onlyEquality?: boolean
}]