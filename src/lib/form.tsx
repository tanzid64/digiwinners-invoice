import {
	createFormHook,
	createFormHookContexts,
	useStore,
} from "@tanstack/react-form";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

function FieldError() {
	const field = useFieldContext<unknown>();
	const errors = useStore(field.store, (s) => s.meta.errors);
	if (!field.state.meta.isTouched || errors.length === 0) return null;
	const msg =
		typeof errors[0] === "string"
			? errors[0]
			: ((errors[0] as { message?: string })?.message ?? "Invalid");
	return <p className="text-destructive text-xs">{msg}</p>;
}

function FieldShell({
	label,
	htmlFor,
	className,
	children,
}: {
	label?: string;
	htmlFor?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={`space-y-2 ${className ?? ""}`}>
			{label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
			{children}
			<FieldError />
		</div>
	);
}

function TextField({
	label,
	type = "text",
	placeholder,
	disabled,
	className,
	autoComplete,
}: {
	label?: string;
	type?: string;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	autoComplete?: string;
}) {
	const field = useFieldContext<string>();
	return (
		<FieldShell label={label} htmlFor={field.name} className={className}>
			<Input
				id={field.name}
				type={type}
				placeholder={placeholder}
				disabled={disabled}
				autoComplete={autoComplete}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				aria-invalid={
					field.state.meta.isTouched && field.state.meta.errors.length > 0
				}
			/>
		</FieldShell>
	);
}

function NumberField({
	label,
	step,
	min,
	placeholder,
	className,
}: {
	label?: string;
	step?: string;
	min?: string;
	placeholder?: string;
	className?: string;
}) {
	const field = useFieldContext<number>();
	return (
		<FieldShell label={label} htmlFor={field.name} className={className}>
			<Input
				id={field.name}
				type="number"
				step={step}
				min={min}
				placeholder={placeholder}
				value={Number.isNaN(field.state.value) ? "" : (field.state.value ?? "")}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.valueAsNumber)}
			/>
		</FieldShell>
	);
}

function TextareaField({
	label,
	rows = 3,
	placeholder,
	className,
}: {
	label?: string;
	rows?: number;
	placeholder?: string;
	className?: string;
}) {
	const field = useFieldContext<string>();
	return (
		<FieldShell label={label} htmlFor={field.name} className={className}>
			<Textarea
				id={field.name}
				rows={rows}
				placeholder={placeholder}
				value={field.state.value ?? ""}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
		</FieldShell>
	);
}

function SelectField({
	label,
	options,
	placeholder,
	className,
	disabled,
}: {
	label?: string;
	options: { value: string; label: string }[];
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}) {
	const field = useFieldContext<string>();
	return (
		<FieldShell label={label} htmlFor={field.name} className={className}>
			<Select
				value={field.state.value || ""}
				onValueChange={(v) => field.handleChange(v)}
				disabled={disabled}
			>
				<SelectTrigger id={field.name} className="w-full">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((o) => (
						<SelectItem key={o.value} value={o.value}>
							{o.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</FieldShell>
	);
}

function SubmitButton({
	label,
	className,
}: {
	label: string;
	className?: string;
}) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
			{([canSubmit, isSubmitting]) => (
				<Button type="submit" disabled={!canSubmit} className={className}>
					{isSubmitting ? "Saving…" : label}
				</Button>
			)}
		</form.Subscribe>
	);
}

export const { useAppForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: { TextField, NumberField, TextareaField, SelectField },
	formComponents: { SubmitButton },
});
