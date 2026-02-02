pipeline {
  agent any
  tools { nodejs "Node22" }
  environment {
    NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Install') {
      steps {
        sh 'npm ci'
        sh 'npm ci --prefix electron'
      }
    }
    stage('Build') {
      steps {
        sh 'npm run make:linux --prefix electron'
        sh 'npm run make:win --prefix electron'
      }
    }
    stage('Version') {
      steps {
        script {
          def baseVersion = sh(
            script: "node -p \"require('./package.json').version\"",
            returnStdout: true
          ).trim()
          def buildVersion = "${baseVersion}+build.${env.BUILD_NUMBER}"
          sh 'mkdir -p dist'
          writeFile file: 'dist/version.txt', text: "${buildVersion}\n"
          env.BUILD_VERSION = buildVersion
        }
      }
    }
    stage('Archive') {
      steps {
        archiveArtifacts artifacts: 'dist/**', fingerprint: true
      }
    }
  }
}
