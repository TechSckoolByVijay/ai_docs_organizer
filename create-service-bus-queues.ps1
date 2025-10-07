# PowerShell script to create Azure Service Bus queues
# Make sure you're logged in to Azure CLI: az login

# Replace with your actual values
$resourceGroupName = "your-resource-group-name"
$serviceBusNamespace = "your-servicebus-namespace-name"

# Queue names as expected by the application
$queues = @(
    "document-processing",
    "search-indexing", 
    "notifications"
)

Write-Host "Creating Service Bus queues..." -ForegroundColor Green

foreach ($queueName in $queues) {
    Write-Host "Creating queue: $queueName" -ForegroundColor Yellow
    
    try {
        az servicebus queue create `
            --resource-group $resourceGroupName `
            --namespace-name $serviceBusNamespace `
            --name $queueName `
            --max-delivery-count 10 `
            --default-message-time-to-live "P14D" `
            --lock-duration "PT5M"
        
        Write-Host "✅ Successfully created queue: $queueName" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to create queue: $queueName" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nQueue creation completed!" -ForegroundColor Green
Write-Host "You can verify the queues in Azure Portal or run: az servicebus queue list --resource-group $resourceGroupName --namespace-name $serviceBusNamespace" -ForegroundColor Cyan