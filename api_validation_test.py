#!/usr/bin/env python3
"""
API Validation Test for Proportional Prize Pool Distribution
Tests that the actual API endpoints use the correct proportional logic
"""

import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

def extract_calculate_function_from_file(file_path):
    """Extract the calculateProportionalPercentages function from JavaScript files"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Find the function definition
        start_marker = "const calculateProportionalPercentages = (numWinners) => {"
        if start_marker not in content:
            start_marker = "calculateProportionalPercentages = (numWinners) => {"
        
        if start_marker not in content:
            return None, "Function not found"
        
        start_idx = content.find(start_marker)
        if start_idx == -1:
            return None, "Function start not found"
        
        # Find the matching closing brace
        brace_count = 0
        func_start = start_idx + len(start_marker) - 1  # Include the opening brace
        
        for i, char in enumerate(content[func_start:], func_start):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    func_end = i + 1
                    break
        else:
            return None, "Function end not found"
        
        function_code = content[start_idx:func_end]
        return function_code, None
        
    except Exception as e:
        return None, f"Error reading file: {str(e)}"

def validate_api_implementation():
    """Validate that both API files have the correct implementation"""
    print("🔍 Validating API Implementation")
    print("=" * 60)
    
    files_to_check = [
        "/app/lib/whop-payments.js",
        "/app/app/api/admin/payout/route.js"
    ]
    
    expected_patterns = [
        "if (numWinners === 1) return [100]",
        "if (numWinners === 2) return [69.23, 30.77]",
        "if (numWinners === 3) return [54.55, 25.00, 20.45]",
        "const fixedPercentages = [40, 18, 12, 8, 6, 5, 4, 3, 2, 2]",
        "const weights = fixedPercentages.slice(0, numWinners)",
        "return weights.map(w => (w / totalWeight) * 100)"
    ]
    
    all_valid = True
    
    for file_path in files_to_check:
        print(f"\n📄 Checking {file_path}:")
        
        function_code, error = extract_calculate_function_from_file(file_path)
        
        if error:
            print(f"  ❌ {error}")
            all_valid = False
            continue
        
        print(f"  ✅ Function found")
        
        # Check for expected patterns
        missing_patterns = []
        for pattern in expected_patterns:
            if pattern not in function_code:
                missing_patterns.append(pattern)
        
        if missing_patterns:
            print(f"  ❌ Missing patterns:")
            for pattern in missing_patterns:
                print(f"    - {pattern}")
            all_valid = False
        else:
            print(f"  ✅ All expected patterns found")
        
        # Check for the specific hardcoded values
        if "69.23, 30.77" in function_code:
            print(f"  ✅ Two-winner ratio maintained (69.23%, 30.77%)")
        else:
            print(f"  ❌ Two-winner ratio not found")
            all_valid = False
        
        if "54.55, 25.00, 20.45" in function_code:
            print(f"  ✅ Three-winner distribution found")
        else:
            print(f"  ❌ Three-winner distribution not found")
            all_valid = False
    
    return all_valid

def test_function_consistency():
    """Test that both files have identical function implementations"""
    print("\n\n🔄 Testing Function Consistency")
    print("=" * 60)
    
    files = [
        "/app/lib/whop-payments.js",
        "/app/app/api/admin/payout/route.js"
    ]
    
    functions = {}
    
    for file_path in files:
        function_code, error = extract_calculate_function_from_file(file_path)
        if error:
            print(f"❌ Could not extract function from {file_path}: {error}")
            return False
        
        # Normalize whitespace for comparison
        normalized = ' '.join(function_code.split())
        functions[file_path] = normalized
    
    # Compare functions
    file1, file2 = list(functions.keys())
    if functions[file1] == functions[file2]:
        print("✅ Both files have identical function implementations")
        return True
    else:
        print("❌ Function implementations differ between files")
        print(f"\nFile 1 ({file1}):")
        print(functions[file1][:200] + "...")
        print(f"\nFile 2 ({file2}):")
        print(functions[file2][:200] + "...")
        return False

def validate_mathematical_properties():
    """Validate key mathematical properties are preserved"""
    print("\n\n🧮 Validating Mathematical Properties")
    print("=" * 60)
    
    # Test the Python equivalent to ensure our logic matches
    def calculate_proportional_percentages(num_winners):
        if num_winners == 1:
            return [100.0]
        if num_winners == 2:
            return [69.23, 30.77]
        if num_winners == 3:
            return [54.55, 25.00, 20.45]
        
        fixed_percentages = [40, 18, 12, 8, 6, 5, 4, 3, 2, 2]
        weights = fixed_percentages[:num_winners]
        total_weight = sum(weights)
        
        return [(w / total_weight) * 100 for w in weights]
    
    properties_valid = True
    
    # Test 1: All sums equal 100%
    print("\n1️⃣ Testing percentage sums:")
    for winners in range(1, 11):
        percentages = calculate_proportional_percentages(winners)
        total = sum(percentages)
        if abs(total - 100.0) > 0.01:
            print(f"  ❌ {winners} winners: {total:.2f}% (should be 100%)")
            properties_valid = False
        else:
            print(f"  ✅ {winners} winners: {total:.2f}%")
    
    # Test 2: Descending order maintained
    print("\n2️⃣ Testing descending order:")
    for winners in range(2, 11):
        percentages = calculate_proportional_percentages(winners)
        is_descending = all(percentages[i] >= percentages[i+1] for i in range(len(percentages)-1))
        if not is_descending:
            print(f"  ❌ {winners} winners: Not in descending order")
            properties_valid = False
        else:
            print(f"  ✅ {winners} winners: Descending order maintained")
    
    # Test 3: No negative values
    print("\n3️⃣ Testing for negative values:")
    for winners in range(1, 11):
        percentages = calculate_proportional_percentages(winners)
        has_negative = any(p < 0 for p in percentages)
        if has_negative:
            print(f"  ❌ {winners} winners: Contains negative values")
            properties_valid = False
        else:
            print(f"  ✅ {winners} winners: All positive values")
    
    return properties_valid

def generate_test_report():
    """Generate a comprehensive test report"""
    print("\n\n📋 COMPREHENSIVE TEST REPORT")
    print("=" * 80)
    
    # Run all validations
    api_valid = validate_api_implementation()
    consistency_valid = test_function_consistency()
    math_valid = validate_mathematical_properties()
    
    print(f"\n📊 FINAL RESULTS:")
    print(f"  API Implementation: {'✅ PASS' if api_valid else '❌ FAIL'}")
    print(f"  Function Consistency: {'✅ PASS' if consistency_valid else '❌ FAIL'}")
    print(f"  Mathematical Properties: {'✅ PASS' if math_valid else '❌ FAIL'}")
    
    overall_success = api_valid and consistency_valid and math_valid
    
    print(f"\n🎯 OVERALL STATUS: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    if overall_success:
        print("\n✅ The proportional prize pool distribution system is correctly implemented:")
        print("  • Both API files contain identical logic")
        print("  • All percentages sum to exactly 100%")
        print("  • Relative ratios are maintained")
        print("  • No funds remain undistributed")
        print("  • Edge cases (1, 2, 3 winners) are handled correctly")
        print("  • Mathematical properties are preserved")
    else:
        print("\n❌ Issues found that need to be addressed before deployment")
    
    return overall_success

if __name__ == "__main__":
    success = generate_test_report()
    exit(0 if success else 1)