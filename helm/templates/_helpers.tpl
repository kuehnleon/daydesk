{{/*
Expand the name of the chart.
*/}}
{{- define "daydesk.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "daydesk.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "daydesk.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "daydesk.labels" -}}
helm.sh/chart: {{ include "daydesk.chart" . }}
{{ include "daydesk.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "daydesk.selectorLabels" -}}
app.kubernetes.io/name: {{ include "daydesk.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "daydesk.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "daydesk.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the Auth0 secret to use
*/}}
{{- define "daydesk.auth0SecretName" -}}
{{- default (printf "%s-auth0" (include "daydesk.fullname" .)) .Values.auth0.existingSecret }}
{{- end }}

{{/*
Create the name of the Postgres secret to use
*/}}
{{- define "daydesk.postgresSecretName" -}}
{{- default (printf "%s-postgres" (include "daydesk.fullname" .)) .Values.postgres.existingSecret }}
{{- end }}
