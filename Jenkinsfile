pipeline {
    agent any

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'prod'],
            description: 'Target environment overlay'
        )
    }

    environment {
        ECR_REPO_NAME = "gym-api-gateway"
        AWS_REGION    = "us-east-1"

        // Safe evaluation fallback for Git SHA
        IMAGE_TAG     = "${env.GIT_COMMIT ? env.GIT_COMMIT.take(7) : 'latest'}"

        // AWS Credentials from Jenkins Store
        AWS_ACCESS_KEY_ID     = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
        AWS_ACCOUNT_ID        = credentials('aws-account-id')

        PATH          = "${WORKSPACE}/.tools/bin:${env.PATH}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Bootstrap CLI Tools') {
            steps {
                sh '''
                    set -e
                    TOOL_BIN="${WORKSPACE}/.tools/bin"
                    mkdir -p "${TOOL_BIN}"
                    export PATH="${TOOL_BIN}:${PATH}"

                    # 1. Install AWS CLI v2 if missing
                    if ! command -v aws >/dev/null 2>&1; then
                        echo "Installing AWS CLI v2..."
                        curl --retry 3 --retry-delay 2 -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
                        cd /tmp && jar xf awscliv2.zip
                        chmod +x /tmp/aws/install
                        /tmp/aws/install --install-dir "${WORKSPACE}/.tools/aws-cli" --bin-dir "${TOOL_BIN}" --update
                        rm -rf /tmp/aws /tmp/awscliv2.zip
                    fi

                    # 2. Install Docker CLI if missing (static binary)
                    if ! command -v docker >/dev/null 2>&1; then
                        echo "Installing Docker CLI..."
                        DOCKER_VER="26.1.4"
                        curl --retry 3 --retry-delay 2 -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VER}.tgz" -o /tmp/docker.tgz
                        tar -xzf /tmp/docker.tgz -C /tmp/
                        mv /tmp/docker/docker "${TOOL_BIN}/"
                        rm -rf /tmp/docker /tmp/docker.tgz
                    fi

                    # Verification
                    echo "--- Tool Versions & Checks ---"
                    aws --version
                    docker --version || echo "Warning: Docker daemon socket check needed"
                '''
            }
        }

        stage('ECR Authentication') {
            steps {
                echo '🔐 Authenticating Docker daemon with AWS ECR...'
                sh """
                    aws ecr get-login-password --region ${env.AWS_REGION} | docker login --username AWS --password-stdin ${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com
                """
            }
        }

        stage('Build & Push Container Image') {
            steps {
                echo "🏭 Building and pushing gym-api-gateway (${env.IMAGE_TAG})..."
                sh """
                    IMAGE_URI="${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com/${env.ECR_REPO_NAME}"

                    # Build image with tags
                    docker build -t "\${IMAGE_URI}:${env.IMAGE_TAG}" -t "\${IMAGE_URI}:latest" .

                    # Push both commit SHA and latest tags to ECR
                    docker push "\${IMAGE_URI}:${env.IMAGE_TAG}"
                    docker push "\${IMAGE_URI}:latest"
                """
            }
        }
    }

    post {
        always {
            deleteDir()
        }
        success {
            echo "✅ gym-api-gateway:${env.IMAGE_TAG} build and push completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed! Check the stage logs above."
        }
    }
}