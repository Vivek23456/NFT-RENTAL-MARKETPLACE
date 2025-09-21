import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { validateSolanaMintAddress, validateSecureUrl, sanitizeTextInput, validateNumericRange, checkRateLimit } from '@/lib/validation';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

interface ListNFTFormProps {
  onSubmit: (formData: ListingFormData) => Promise<void>;
  loading?: boolean;
}

interface ListingFormData {
  mintAddress: string;
  name: string;
  description: string;
  imageUrl: string;
  dailyRentSOL: number;
  collateralSOL: number;
  minDurationDays: number;
  maxDurationDays: number;
}

const ListNFTForm: React.FC<ListNFTFormProps> = ({ onSubmit, loading = false }) => {
  const { toast } = useToast();
  const { logValidationError, logSuspiciousInput, logRateLimitExceeded } = useSecurityMonitor();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ListingFormData>({
    mintAddress: '',
    name: '',
    description: '',
    imageUrl: '',
    dailyRentSOL: 0.1,
    collateralSOL: 1.0,
    minDurationDays: 1,
    maxDurationDays: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    const rateCheck = checkRateLimit('nft-listing-submit', 3, 60000);
    if (!rateCheck.allowed) {
      logRateLimitExceeded('nft-listing-submit', 3);
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many listing attempts. Please wait before trying again.",
        variant: "destructive",
      });
      return;
    }

    // Enhanced validation with security monitoring
    const mintValidation = validateSolanaMintAddress(formData.mintAddress);
    if (!mintValidation.isValid) {
      logValidationError('mintAddress', mintValidation.error || 'Invalid mint address', formData.mintAddress);
      toast({
        title: "Error",
        description: mintValidation.error || "Invalid NFT mint address",
        variant: "destructive",
      });
      return;
    }

    // Validate image URL if provided
    if (formData.imageUrl.trim()) {
      const urlValidation = validateSecureUrl(formData.imageUrl);
      if (!urlValidation.isValid) {
        logValidationError('imageUrl', urlValidation.error || 'Invalid URL', formData.imageUrl);
        toast({
          title: "Error",
          description: urlValidation.error || "Invalid image URL",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate numeric ranges
    const rentValidation = validateNumericRange(formData.dailyRentSOL, 0.001, 1000, 'Daily rent');
    if (!rentValidation.isValid) {
      logValidationError('dailyRentSOL', rentValidation.error || 'Invalid rent amount', formData.dailyRentSOL.toString());
      toast({
        title: "Error",
        description: rentValidation.error,
        variant: "destructive",
      });
      return;
    }

    const collateralValidation = validateNumericRange(formData.collateralSOL, 0.001, 10000, 'Collateral');
    if (!collateralValidation.isValid) {
      logValidationError('collateralSOL', collateralValidation.error || 'Invalid collateral amount', formData.collateralSOL.toString());
      toast({
        title: "Error",
        description: collateralValidation.error,
        variant: "destructive",
      });
      return;
    }

    const minDurationValidation = validateNumericRange(formData.minDurationDays, 1, 365, 'Minimum duration');
    if (!minDurationValidation.isValid) {
      logValidationError('minDurationDays', minDurationValidation.error || 'Invalid duration', formData.minDurationDays.toString());
      toast({
        title: "Error",
        description: minDurationValidation.error,
        variant: "destructive",
      });
      return;
    }

    const maxDurationValidation = validateNumericRange(formData.maxDurationDays, 1, 365, 'Maximum duration');
    if (!maxDurationValidation.isValid) {
      logValidationError('maxDurationDays', maxDurationValidation.error || 'Invalid duration', formData.maxDurationDays.toString());
      toast({
        title: "Error",
        description: maxDurationValidation.error,
        variant: "destructive",
      });
      return;
    }

    if (formData.minDurationDays > formData.maxDurationDays) {
      logValidationError('durationRange', 'Min duration greater than max duration', `${formData.minDurationDays}-${formData.maxDurationDays}`);
      toast({
        title: "Error",
        description: "Minimum duration cannot be greater than maximum duration",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        mintAddress: '',
        name: '',
        description: '',
        imageUrl: '',
        dailyRentSOL: 0.1,
        collateralSOL: 1.0,
        minDurationDays: 1,
        maxDurationDays: 30,
      });
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ListingFormData, value: string | number) => {
    let processedValue = value;
    
    // Sanitize text inputs for security
    if (typeof value === 'string' && (field === 'name' || field === 'description')) {
      const originalLength = value.length;
      processedValue = sanitizeTextInput(value, field === 'description' ? 2000 : 100);
      
      // Log if content was modified during sanitization
      if (processedValue !== value) {
        logSuspiciousInput(field, 'Content sanitized during input', value);
      }
      
      // Check for suspiciously long input
      if (originalLength > (field === 'description' ? 1000 : 50)) {
        logSuspiciousInput(field, 'Unusually long input detected', value);
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          List Your NFT for Rent
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mintAddress">NFT Mint Address *</Label>
                <Input
                  id="mintAddress"
                  value={formData.mintAddress}
                  onChange={(e) => handleInputChange('mintAddress', e.target.value)}
                  placeholder="Enter NFT mint address"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">NFT Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="My Awesome NFT"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your NFT..."
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://..."
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dailyRent">Daily Rent (SOL) *</Label>
                <Input
                  id="dailyRent"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.dailyRentSOL}
                  onChange={(e) => handleInputChange('dailyRentSOL', parseFloat(e.target.value) || 0)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collateral">Collateral (SOL) *</Label>
                <Input
                  id="collateral"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.collateralSOL}
                  onChange={(e) => handleInputChange('collateralSOL', parseFloat(e.target.value) || 0)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minDuration">Min Duration (days) *</Label>
                <Input
                  id="minDuration"
                  type="number"
                  min="1"
                  value={formData.minDurationDays}
                  onChange={(e) => handleInputChange('minDurationDays', parseInt(e.target.value) || 1)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDuration">Max Duration (days) *</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  min="1"
                  value={formData.maxDurationDays}
                  onChange={(e) => handleInputChange('maxDurationDays', parseInt(e.target.value) || 1)}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            variant="hero" 
            className="w-full"
            disabled={loading || isSubmitting}
          >
            {isSubmitting ? "Creating Listing..." : "List NFT for Rent"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ListNFTForm;
export type { ListingFormData };